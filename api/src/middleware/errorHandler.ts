import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof Error) {
    console.error('[error]', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Internal server error' });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
