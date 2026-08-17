import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import type { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'nexa_token';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { profile: true } });
    if (!user) return res.status(401).json({ error: 'Invalid session' });
    req.user = user;
    req.auth = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
}

export function requireActiveCustomer(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role === 'CUSTOMER' && req.user?.status !== 'ACTIVE') {
    return res.status(403).json({ error: `Account is ${req.user?.status?.toLowerCase()}. Please contact support.` });
  }
  next();
}

declare global {
  namespace Express {
    interface Request {
      user?: Awaited<ReturnType<typeof prisma.user.findUnique>> & { profile?: unknown };
      auth?: JwtPayload;
    }
  }
}
