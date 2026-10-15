import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function signup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        name: body.name,
      },
    });

    const token = signToken(user.id, user.email);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, err.errors[0]?.message ?? 'Invalid input'));
      return;
    }
    next(err);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = signToken(user.id, user.email);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, err.errors[0]?.message ?? 'Invalid input'));
      return;
    }
    next(err);
  }
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  res.json({ ok: true });
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
