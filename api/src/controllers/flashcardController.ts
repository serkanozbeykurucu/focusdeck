import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export async function getDueFlashcards(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const documentId = req.query.documentId as string | undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10) || 20, 50);

    if (!documentId) {
      throw new AppError(400, 'documentId query parameter is required');
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: req.user.userId },
    });
    if (!document) throw new AppError(404, 'Document not found');

    const now = new Date();
    const flashcards = await prisma.flashcard.findMany({
      where: {
        documentId,
        nextReviewAt: { lte: now },
      },
      orderBy: { nextReviewAt: 'asc' },
      take: limit,
    });

    res.json({ flashcards, count: flashcards.length });
  } catch (err) {
    next(err);
  }
}
