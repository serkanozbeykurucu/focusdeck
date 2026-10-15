import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { calculateSm2 } from '../services/sm2Service';

const reviewSchema = z.object({
  flashcardId: z.string().uuid(),
  quality: z.number().int().min(0).max(5),
  sessionId: z.string().uuid().optional(),
});

export async function createReview(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const body = reviewSchema.parse(req.body);

    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id: body.flashcardId,
        document: { userId: req.user.userId },
      },
    });
    if (!flashcard) throw new AppError(404, 'Flashcard not found');

    if (body.sessionId) {
      const session = await prisma.studySession.findFirst({
        where: { id: body.sessionId, userId: req.user.userId, endedAt: null },
      });
      if (!session) throw new AppError(404, 'Active session not found');
    }

    const previousInterval = flashcard.interval;
    const previousEaseFactor = flashcard.easeFactor;
    const now = new Date();
    const result = calculateSm2(
      {
        easeFactor: flashcard.easeFactor,
        interval: flashcard.interval,
        repetitions: flashcard.repetitions,
      },
      body.quality,
      now
    );

    const [review] = await prisma.$transaction([
      prisma.review.create({
        data: {
          flashcardId: flashcard.id,
          userId: req.user.userId,
          quality: body.quality,
          reviewedAt: now,
          previousInterval,
          newInterval: result.interval,
          previousEaseFactor,
          newEaseFactor: result.easeFactor,
          sessionId: body.sessionId ?? null,
        },
      }),
      prisma.flashcard.update({
        where: { id: flashcard.id },
        data: {
          easeFactor: result.easeFactor,
          interval: result.interval,
          repetitions: result.repetitions,
          nextReviewAt: result.nextReviewAt,
          lastReviewedAt: now,
        },
      }),
      ...(body.sessionId
        ? [
            prisma.studySession.update({
              where: { id: body.sessionId },
              data: { cardsReviewed: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    res.status(201).json({
      review,
      flashcard: {
        id: flashcard.id,
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReviewAt: result.nextReviewAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, err.errors[0]?.message ?? 'Invalid input'));
      return;
    }
    next(err);
  }
}

export async function listReviews(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const reviews = await prisma.review.findMany({
      where: {
        userId: req.user.userId,
        ...(from || to
          ? {
              reviewedAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { reviewedAt: 'desc' },
      take: 500,
      include: {
        flashcard: { select: { question: true, documentId: true } },
      },
    });

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}
