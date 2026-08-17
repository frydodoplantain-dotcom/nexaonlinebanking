import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireActiveCustomer } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getSetting } from '../services/settingsService.js';
import { notifyAdmins } from '../services/notificationService.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();

router.get('/fees', requireAuth, async (_req, res, next) => {
  try {
    const [virtualFee, physicalFee, replacementFee] = await Promise.all([
      getSetting('virtualCardFee'),
      getSetting('physicalCardFee'),
      getSetting('cardReplacementFee'),
    ]);
    res.json({ virtualFee: parseFloat(virtualFee), physicalFee: parseFloat(physicalFee), replacementFee: parseFloat(replacementFee) });
  } catch (e) {
    next(e);
  }
});

router.get('/', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const [requests, cards] = await Promise.all([
      prisma.cardRequest.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: 'desc' } }),
      prisma.card.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ requests, cards });
  } catch (e) {
    next(e);
  }
});

router.post('/request', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const { cardType } = z.object({ cardType: z.enum(['VIRTUAL', 'PHYSICAL']) }).parse(req.body);
    const feeKey = cardType === 'VIRTUAL' ? 'virtualCardFee' : 'physicalCardFee';
    const fee = parseFloat(await getSetting(feeKey));

    const request = await prisma.cardRequest.create({
      data: { userId: req.auth!.userId, cardType, fee, status: 'PENDING' },
    });

    await notifyAdmins('New card request', `A customer requested a ${cardType.toLowerCase()} card.`, 'CARD', request.id);
    await createAuditLog({ actorId: req.auth!.userId, action: 'CARD_REQUEST', targetType: 'CardRequest', targetId: request.id, req });

    res.status(201).json({ ...request, fee });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/freeze', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const cardId = req.params.id as string;
    const card = await prisma.card.findFirst({ where: { id: cardId, userId: req.auth!.userId } });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const newStatus = card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    const updated = await prisma.card.update({ where: { id: card.id }, data: { status: newStatus } });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
