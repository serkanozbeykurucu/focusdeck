import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const startSchema = z.object({
  pomodoroEnabled: z.boolean().optional().default(false),
  pomodoroMinutes: z.number().int().min(1).max(120).optional().default(25),
  documentId: z.string().uuid().optional(),
});

export async function startSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const body = startSchema.parse(req.body ?? {});

    const session = await prisma.studySession.create({
      data: {
        userId: req.user.userId,
        pomodoroEnabled: body.pomodoroEnabled,
        pomodoroMinutes: body.pomodoroMinutes,
      },
    });

    res.status(201).json({ session });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, err.errors[0]?.message ?? 'Invalid input'));
      return;
    }
    next(err);
  }
}

export async function endSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const existing = await prisma.studySession.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { reviews: true },
    });
    if (!existing) throw new AppError(404, 'Session not found');

    const finalSession = existing.endedAt
      ? existing
      : await prisma.studySession.update({
          where: { id: existing.id },
          data: { endedAt: new Date() },
          include: { reviews: true },
        });

    const reviews = finalSession.reviews;
    const distribution: Record<string, number> = {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
      other: 0,
    };
    for (const r of reviews) {
      if (r.quality === 1) distribution.again += 1;
      else if (r.quality === 3) distribution.hard += 1;
      else if (r.quality === 4) distribution.good += 1;
      else if (r.quality === 5) distribution.easy += 1;
      else distribution.other += 1;
    }

    const successful = reviews.filter((r) => r.quality >= 3).length;
    const retentionEstimate =
      reviews.length === 0 ? 0 : Math.round((successful / reviews.length) * 1000) / 10;

    res.json({
      session: finalSession,
      summary: {
        cardsReviewed: finalSession.cardsReviewed,
        ratingDistribution: distribution,
        retentionEstimate,
        durationMinutes: Math.round(
          ((finalSession.endedAt?.getTime() ?? Date.now()) - finalSession.startedAt.getTime()) /
            60000
        ),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listSessions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const sessions = await prisma.studySession.findMany({
      where: { userId: req.user.userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function getRetentionStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const reviews = await prisma.review.findMany({
      where: { userId: req.user.userId },
      orderBy: { reviewedAt: 'asc' },
      select: { quality: true, reviewedAt: true },
    });

    const byDay = new Map<string, { total: number; success: number }>();
    for (const r of reviews) {
      const day = r.reviewedAt.toISOString().slice(0, 10);
      const entry = byDay.get(day) ?? { total: 0, success: 0 };
      entry.total += 1;
      if (r.quality >= 3) entry.success += 1;
      byDay.set(day, entry);
    }

    const retention = Array.from(byDay.entries()).map(([date, v]) => ({
      date,
      total: v.total,
      success: v.success,
      rate: v.total === 0 ? 0 : Math.round((v.success / v.total) * 1000) / 10,
    }));

    res.json({ retention });
  } catch (err) {
    next(err);
  }
}

export async function getActivityStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const [reviews, documents, dueCount, recentSessions] = await Promise.all([
      prisma.review.findMany({
        where: { userId: req.user.userId },
        orderBy: { reviewedAt: 'desc' },
        take: 20,
        include: { flashcard: { select: { question: true } } },
      }),
      prisma.document.findMany({
        where: { userId: req.user.userId },
        include: { _count: { select: { flashcards: true } } },
      }),
      prisma.flashcard.count({
        where: {
          document: { userId: req.user.userId },
          nextReviewAt: { lte: new Date() },
        },
      }),
      prisma.studySession.findMany({
        where: { userId: req.user.userId },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
    ]);

    const byDay = new Map<string, number>();
    const allReviews = await prisma.review.findMany({
      where: { userId: req.user.userId },
      select: { reviewedAt: true },
    });
    for (const r of allReviews) {
      const day = r.reviewedAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    res.json({
      cardsDue: dueCount,
      cardsPerDay: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      cardsPerDocument: documents.map((d) => ({
        documentId: d.id,
        title: d.title,
        count: d._count.flashcards,
      })),
      recentActivity: reviews.map((r) => ({
        id: r.id,
        quality: r.quality,
        reviewedAt: r.reviewedAt,
        question: r.flashcard.question,
      })),
      recentSessions,
    });
  } catch (err) {
    next(err);
  }
}
