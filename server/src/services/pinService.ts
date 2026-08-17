import bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const cred = await prisma.pinCredential.findUnique({ where: { userId } });
  if (!cred || !cred.enabled) throw new Error('PIN is not enabled for this account');
  if (cred.locked) {
    if (cred.lockedUntil && cred.lockedUntil > new Date()) throw new Error('PIN is locked. Please contact support.');
    await prisma.pinCredential.update({ where: { userId }, data: { locked: false, failedAttempts: 0, lockedUntil: null } });
  }
  const valid = await bcrypt.compare(pin, cred.pinHash);
  if (!valid) {
    const attempts = cred.failedAttempts + 1;
    const locked = attempts >= 5;
    await prisma.pinCredential.update({
      where: { userId },
      data: {
        failedAttempts: attempts,
        locked,
        lockedUntil: locked ? new Date(Date.now() + 30 * 60 * 1000) : null,
      },
    });
    throw new Error('Invalid PIN');
  }
  await prisma.pinCredential.update({ where: { userId }, data: { failedAttempts: 0 } });
  return true;
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function resetPin(userId: string, newPin: string, adminId: string, req?: Request) {
  const pinHash = await hashPin(newPin);
  await prisma.pinCredential.upsert({
    where: { userId },
    create: { userId, pinHash, mustChange: true },
    update: { pinHash, mustChange: true, locked: false, failedAttempts: 0, lockedUntil: null, enabled: true },
  });
  const { createAuditLog } = await import('./auditService.js');
  await createAuditLog({
    actorId: adminId,
    action: 'PIN_RESET',
    targetType: 'User',
    targetId: userId,
    reason: 'Admin reset PIN',
    req,
  });
}

export async function updatePinState(userId: string, updates: {
  enabled?: boolean;
  locked?: boolean;
  mustChange?: boolean;
}, adminId: string, req?: Request) {
  const before = await prisma.pinCredential.findUnique({ where: { userId } });
  await prisma.pinCredential.update({
    where: { userId },
    data: updates,
  });
  const { createAuditLog } = await import('./auditService.js');
  await createAuditLog({
    actorId: adminId,
    action: 'PIN_STATE_UPDATE',
    targetType: 'User',
    targetId: userId,
    previousValue: before ? { enabled: before.enabled, locked: before.locked, mustChange: before.mustChange } : null,
    newValue: updates,
    req,
  });
}
