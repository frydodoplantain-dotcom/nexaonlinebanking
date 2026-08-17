import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireActiveCustomer } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { generateReference } from '../utils/generators.js';
import { creditAccount, debitAccount } from '../services/ledgerService.js';
import { verifyPin } from '../services/pinService.js';
import { getTransferFee } from '../services/settingsService.js';
import { createAuditLog } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

router.get('/lookup', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const recipient = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER',
        status: 'ACTIVE',
        id: { not: req.auth!.userId },
        OR: [
          { email: q.toLowerCase() },
          { accounts: { some: { accountNumber: q } } },
        ],
      },
      include: { profile: true, accounts: { where: { status: 'ACTIVE' } } },
    });

    if (!recipient) return res.status(404).json({ error: 'Recipient not found or account is not active' });

    res.json({
      id: recipient.id,
      name: `${recipient.profile?.firstName} ${recipient.profile?.lastName}`,
      email: recipient.email,
      country: recipient.profile?.country,
      photoPath: recipient.profile?.photoPath,
      accounts: recipient.accounts.map((a) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        currency: a.currency,
        type: a.type,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/internal', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const data = z.object({
      fromAccountId: z.string(),
      toAccountId: z.string(),
      recipientUserId: z.string(),
      amount: z.number().positive(),
      purpose: z.string().optional(),
      pin: z.string().length(4),
    }).parse(req.body);

    await verifyPin(req.auth!.userId, data.pin);

    const [fromAccount, toAccount, sender, recipient] = await Promise.all([
      prisma.account.findFirst({ where: { id: data.fromAccountId, userId: req.auth!.userId, status: 'ACTIVE' }, include: { user: { include: { profile: true } } } }),
      prisma.account.findFirst({ where: { id: data.toAccountId, userId: data.recipientUserId, status: 'ACTIVE' }, include: { user: { include: { profile: true } } } }),
      prisma.user.findUnique({ where: { id: req.auth!.userId }, include: { profile: true } }),
      prisma.user.findUnique({ where: { id: data.recipientUserId }, include: { profile: true } }),
    ]);

    if (!fromAccount || !toAccount) return res.status(400).json({ error: 'Invalid account' });
    if (fromAccount.currency !== toAccount.currency) return res.status(400).json({ error: 'Currency mismatch between accounts' });
    if (fromAccount.availableBalance < data.amount) return res.status(400).json({ error: 'Insufficient balance' });

    const fee = await getTransferFee(data.amount);
    const totalDebit = data.amount + fee;
    if (fromAccount.availableBalance < totalDebit) return res.status(400).json({ error: 'Insufficient balance including fees' });

    const reference = generateReference();
    const senderName = `${sender?.profile?.firstName} ${sender?.profile?.lastName}`;
    const recipientName = `${recipient?.profile?.firstName} ${recipient?.profile?.lastName}`;

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.create({
        data: {
          reference,
          type: 'INTERNAL',
          status: 'COMPLETED',
          senderUserId: req.auth!.userId,
          recipientUserId: data.recipientUserId,
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          amount: data.amount,
          fee,
          currency: fromAccount.currency,
          purpose: data.purpose,
        },
      });

      const debit = await debitAccount(tx, {
        accountId: fromAccount.id,
        amount: totalDebit,
        currency: fromAccount.currency,
        type: 'TRANSFER',
        description: `Transfer to ${recipientName}`,
        reference: `${reference}-DR`,
        userId: req.auth!.userId,
        recipientName,
        recipientBank: 'NEXA',
        recipientAccount: toAccount.accountNumber,
        recipientCountry: recipient?.profile?.country,
        transferId: transfer.id,
        fee,
      });

      const credit = await creditAccount(tx, {
        accountId: toAccount.id,
        amount: data.amount,
        currency: toAccount.currency,
        type: 'TRANSFER',
        description: `Transfer from ${senderName}`,
        reference: `${reference}-CR`,
        userId: data.recipientUserId,
        senderName,
        senderBank: 'NEXA',
        senderAccount: fromAccount.accountNumber,
        senderCountry: sender?.profile?.country,
        transferId: transfer.id,
      });

      return { transfer, debit, credit };
    }, { timeout: 20000 });

    await createNotification({
      userId: req.auth!.userId,
      title: 'Transfer completed',
      message: `You sent ${fromAccount.currency} ${data.amount.toFixed(2)} to ${recipientName}.`,
      type: 'TRANSFER',
      relatedId: result.transfer.id,
    });
    await createNotification({
      userId: data.recipientUserId,
      title: 'Transfer received',
      message: `You received ${fromAccount.currency} ${data.amount.toFixed(2)} from ${senderName}.`,
      type: 'TRANSFER',
      relatedId: result.transfer.id,
    });
    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'INTERNAL_TRANSFER',
      targetType: 'Transfer',
      targetId: result.transfer.id,
      newValue: { amount: data.amount, from: fromAccount.accountNumber, to: toAccount.accountNumber },
      req,
    });

    res.json({
      reference,
      transferId: result.transfer.id,
      amount: data.amount,
      fee,
      total: totalDebit,
      currency: fromAccount.currency,
      status: 'COMPLETED',
      sender: senderName,
      senderAccount: fromAccount.accountNumber,
      recipient: recipientName,
      recipientAccount: toAccount.accountNumber,
      date: new Date().toISOString(),
      purpose: data.purpose,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/external', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const data = z.object({
      fromAccountId: z.string(),
      amount: z.number().positive(),
      recipientName: z.string(),
      bankName: z.string().optional(),
      accountNumber: z.string(),
      country: z.string(),
      swift: z.string().optional(),
      iban: z.string().optional(),
      routing: z.string().optional(),
      sortCode: z.string().optional(),
      bsb: z.string().optional(),
      address: z.string().optional(),
      purpose: z.string().optional(),
      pin: z.string().length(4),
    }).parse(req.body);

    await verifyPin(req.auth!.userId, data.pin);

    const fromAccount = await prisma.account.findFirst({
      where: { id: data.fromAccountId, userId: req.auth!.userId, status: 'ACTIVE' },
      include: { user: { include: { profile: true } } },
    });
    if (!fromAccount) return res.status(400).json({ error: 'Invalid account' });

    const fee = await getTransferFee(data.amount);
    const total = data.amount + fee;
    if (fromAccount.availableBalance < total) return res.status(400).json({ error: 'Insufficient balance' });

    const reference = generateReference();
    const senderName = `${fromAccount.user.profile?.firstName} ${fromAccount.user.profile?.lastName}`;

    const transfer = await prisma.$transaction(async (tx) => {
      const t = await tx.transfer.create({
        data: {
          reference,
          type: 'EXTERNAL',
          status: 'PENDING',
          senderUserId: req.auth!.userId,
          fromAccountId: fromAccount.id,
          amount: data.amount,
          fee,
          currency: fromAccount.currency,
          purpose: data.purpose,
          externalBankName: data.bankName,
          externalAccountName: data.recipientName,
          externalAccountNum: data.accountNumber,
          externalCountry: data.country,
          externalSwift: data.swift,
          externalIban: data.iban,
          externalRouting: data.routing,
          externalSortCode: data.sortCode,
          externalBsb: data.bsb,
          externalAddress: data.address,
        },
      });

      await debitAccount(tx, {
        accountId: fromAccount.id,
        amount: total,
        currency: fromAccount.currency,
        type: 'TRANSFER',
        description: `External transfer to ${data.recipientName}`,
        reference,
        userId: req.auth!.userId,
        recipientName: data.recipientName,
        recipientBank: data.bankName,
        recipientAccount: data.accountNumber,
        recipientCountry: data.country,
        transferId: t.id,
        fee,
        status: 'PENDING',
      });

      return t;
    });

    const { notifyAdmins } = await import('../services/notificationService.js');
    await notifyAdmins('New external transfer request', `${senderName} submitted an external transfer of ${fromAccount.currency} ${data.amount}.`, 'TRANSFER', transfer.id);
    await createAuditLog({ actorId: req.auth!.userId, action: 'EXTERNAL_TRANSFER_REQUEST', targetType: 'Transfer', targetId: transfer.id, req });

    res.status(201).json({ reference, transferId: transfer.id, status: 'PENDING', message: 'External transfer request submitted for review.' });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/receipt', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        senderUser: { include: { profile: true } },
        recipientUser: { include: { profile: true } },
        fromAccount: true,
        toAccount: true,
      },
    });
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    if (transfer.senderUserId !== req.auth!.userId && transfer.recipientUserId !== req.auth!.userId && req.auth!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const t = transfer as typeof transfer & { senderUser?: any; recipientUser?: any; fromAccount?: any; toAccount?: any };
    res.json({
      reference: t.reference,
      status: t.status,
      type: t.type,
      amount: t.amount,
      fee: t.fee,
      total: t.amount + t.fee,
      currency: t.currency,
      purpose: t.purpose,
      date: t.createdAt,
      sender: t.senderUser ? `${t.senderUser.profile?.firstName} ${t.senderUser.profile?.lastName}` : null,
      senderAccount: t.fromAccount?.accountNumber,
      recipient: t.recipientUser ? `${t.recipientUser.profile?.firstName} ${t.recipientUser.profile?.lastName}` : t.externalAccountName,
      recipientAccount: t.toAccount?.accountNumber ?? t.externalAccountNum,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
