import { prisma } from '../lib/prisma.js';
import type { NotificationType } from '@prisma/client';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
}) {
  return prisma.notification.create({ data: params });
}

export async function notifyAdmins(title: string, message: string, type: NotificationType, relatedId?: string) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  await Promise.all(
    admins.map((admin) =>
      createNotification({ userId: admin.id, title, message, type, relatedId })
    )
  );
}
