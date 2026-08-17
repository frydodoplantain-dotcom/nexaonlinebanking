import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';

export async function createAuditLog(
  params: {
    actorId?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    previousValue?: unknown;
    newValue?: unknown;
    reason?: string;
    req?: Request;
  },
  db: any = prisma
) {
  await db.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      reason: params.reason ?? null,
      ipAddress: params.req?.ip ?? params.req?.socket?.remoteAddress ?? null,
      userAgent: params.req?.headers['user-agent'] ?? null,
    },
  });
}
