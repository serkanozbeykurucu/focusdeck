import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { PromptStrategy } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { extractText, countWords } from '../services/pdfService';
import { generateFlashcards } from '../services/llmService';
import { config } from '../config';

const generateSchema = z.object({
  strategy: z.nativeEnum(PromptStrategy),
  numQuestions: z.number().int().min(1).max(30).optional().default(10),
});

export async function uploadDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (!req.file) throw new AppError(400, 'No file uploaded');

    const title = (req.body.title as string)?.trim() || req.file.originalname;
    const filePath = req.file.path;

    let extractedText: string;
    try {
      extractedText = await extractText(filePath, req.file.mimetype, req.file.originalname);
    } catch (err) {
      await fs.unlink(filePath).catch(() => undefined);
      throw err instanceof Error ? new AppError(400, err.message) : err;
    }

    if (!extractedText) {
      await fs.unlink(filePath).catch(() => undefined);
      throw new AppError(400, 'Could not extract text from file');
    }

    const document = await prisma.document.create({
      data: {
        userId: req.user.userId,
        title,
        originalFilename: req.file.originalname,
        extractedText,
        wordCount: countWords(extractedText),
      },
    });

    await fs.unlink(filePath).catch(() => undefined);

    res.status(201).json({ document });
  } catch (err) {
    next(err);
  }
}

export async function listDocuments(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const documents = await prisma.document.findMany({
      where: { userId: req.user.userId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        _count: { select: { flashcards: true } },
      },
    });

    res.json({
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        originalFilename: d.originalFilename,
        wordCount: d.wordCount,
        uploadedAt: d.uploadedAt,
        flashcardCount: d._count.flashcards,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { _count: { select: { flashcards: true } } },
    });
    if (!document) throw new AppError(404, 'Document not found');

    res.json({
      document: {
        ...document,
        flashcardCount: document._count.flashcards,
        _count: undefined,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!document) throw new AppError(404, 'Document not found');

    await prisma.document.delete({ where: { id: document.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function generateDocumentFlashcards(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const body = generateSchema.parse(req.body);

    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!document) throw new AppError(404, 'Document not found');

    const generated = await generateFlashcards(
      document.extractedText,
      body.strategy,
      body.numQuestions
    );

    const flashcards = await prisma.$transaction(
      generated.map((card) =>
        prisma.flashcard.create({
          data: {
            documentId: document.id,
            question: card.question,
            answer: card.answer,
            promptStrategy: body.strategy,
            bloomLevel: card.bloomLevel ?? null,
          },
        })
      )
    );

    res.status(201).json({ flashcards, count: flashcards.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, err.errors[0]?.message ?? 'Invalid input'));
      return;
    }
    next(err);
  }
}

export async function listDocumentFlashcards(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!document) throw new AppError(404, 'Document not found');

    const flashcards = await prisma.flashcard.findMany({
      where: { documentId: document.id },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ flashcards });
  } catch (err) {
    next(err);
  }
}

export function ensureUploadDir(): string {
  const dir = path.resolve(config.uploadDir);
  return dir;
}
