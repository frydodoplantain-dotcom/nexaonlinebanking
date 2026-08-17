import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (err instanceof ZodError) {
    const msg = err.issues[0]?.message || 'Invalid request';
    return res.status(400).json({ error: msg });
  }
  const message = err.message || 'Internal server error';
  const status = message.includes('Insufficient') ? 400
    : message.includes('Unauthorized') || message.includes('Invalid PIN') ? 403
    : message.includes('not found') ? 404
    : message.includes('already exists') || message.includes('Duplicate') ? 409
    : 500;
  res.status(status).json({ error: status === 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : message });
}

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
