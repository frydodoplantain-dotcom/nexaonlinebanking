import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireActiveCustomer } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { notifyAdmins } from '../services/notificationService.js';

const router = Router();

router.get('/', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.auth!.userId },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (e) {
    next(e);
  }
});

router.post('/', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const data = z.object({
      subject: z.string().min(1),
      message: z.string().min(1),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    }).parse(req.body);

    const ticket = await prisma.supportTicket.create({ data: { ...data, userId: req.auth!.userId } });
    await notifyAdmins('New support ticket', data.subject, 'SUPPORT', ticket.id);
    res.status(201).json(ticket);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reply', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const { message } = z.object({ message: z.string().min(1) }).parse(req.body);
    const ticketId = req.params.id as string;
    const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, userId: req.auth!.userId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    const reply = await prisma.supportReply.create({ data: { ticketId: ticket.id, message, isAdmin: false } });
    res.status(201).json(reply);
  } catch (e) {
    next(e);
  }
});

export default router;
