import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth, requireActiveCustomer } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getCountryList } from '../config/countries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '')}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WebP images are allowed'));
  },
});

const router = Router();

router.get('/countries', (_req, res) => {
  res.json(getCountryList());
});

router.get('/dashboard', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const [user, accounts, transactions, cards, loans, unreadCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
      prisma.account.findMany({ where: { userId, status: 'ACTIVE' }, orderBy: { type: 'asc' } }),
      prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.card.findMany({ where: { userId, status: { in: ['ACTIVE', 'FROZEN'] } } }),
      prisma.loan.findMany({ where: { userId, status: { in: ['ACTIVE', 'OVERDUE'] } } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const availableBalance = accounts.reduce((s, a) => s + a.availableBalance, 0);

    res.json({
      user,
      accounts,
      totalBalance,
      availableBalance,
      recentTransactions: transactions,
      cards,
      loans,
      unreadNotifications: unreadCount,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/accounts', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({ where: { userId: req.auth!.userId } });
    res.json(accounts);
  } catch (e) {
    next(e);
  }
});

router.get('/transactions', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = { userId: req.auth!.userId };
    if (status && status !== 'ALL') where.status = status;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit as string) }),
      prisma.transaction.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (e) {
    next(e);
  }
});

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const { firstName, middleName, lastName, phone, city, address, zip, state } = req.body;
    const profile = await prisma.userProfile.update({
      where: { userId: req.auth!.userId },
      data: { firstName, middleName, lastName, phone, city, address, zip, state },
    });
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

router.post('/profile/photo', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const photoPath = `/uploads/${req.file.filename}`;
    await prisma.userProfile.update({
      where: { userId: req.auth!.userId },
      data: { photoPath },
    });
    res.json({ photoPath });
  } catch (e) {
    next(e);
  }
});

router.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (e) {
    next(e);
  }
});

router.patch('/notifications/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.auth!.userId, read: false }, data: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    next(e);
  }
});

router.delete('/notifications/:id', requireAuth, async (req, res, next) => {
  try {
    const notifId = req.params.id as string;
    await prisma.notification.deleteMany({ where: { id: notifId, userId: req.auth!.userId } });
    res.json({ message: 'Notification deleted' });
  } catch (e) {
    next(e);
  }
});

router.post('/kyc', requireAuth, upload.fields([{ name: 'idDocument', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), async (req, res, next) => {
  try {
    const { idType, idNumber } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const idDocumentPath = files?.idDocument?.[0] ? `/uploads/${files.idDocument[0].filename}` : undefined;
    const photoPath = files?.photo?.[0] ? `/uploads/${files.photo[0].filename}` : undefined;

    const dataToUpdate: Record<string, unknown> = {
      kycStatus: 'PENDING',
      kycRejectionReason: null,
    };
    if (idType) dataToUpdate.idType = idType;
    if (idNumber) dataToUpdate.idNumber = idNumber;
    if (idDocumentPath) dataToUpdate.idDocumentPath = idDocumentPath;
    if (photoPath) dataToUpdate.photoPath = photoPath;

    const profile = await prisma.userProfile.update({
      where: { userId: req.auth!.userId },
      data: dataToUpdate as any,
    });

    res.json({ message: 'KYC documents submitted successfully for admin verification.', profile });
  } catch (e) {
    next(e);
  }
});

router.post('/accounts/transfer-savings', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const { amount, direction, pin } = req.body;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const { verifyPin } = await import('../services/pinService.js');
    if (pin) await verifyPin(req.auth!.userId, pin);

    const [checking, savings] = await Promise.all([
      prisma.account.findFirst({ where: { userId: req.auth!.userId, type: 'CHECKING', status: 'ACTIVE' } }),
      prisma.account.findFirst({ where: { userId: req.auth!.userId, type: 'SAVINGS', status: 'ACTIVE' } }),
    ]);

    if (!checking || !savings) return res.status(400).json({ error: 'Checking or Savings account not found' });

    const fromAcc = direction === 'TO_SAVINGS' ? checking : savings;
    const toAcc = direction === 'TO_SAVINGS' ? savings : checking;

    if (fromAcc.availableBalance < numAmount) return res.status(400).json({ error: 'Insufficient funds' });

    const { creditAccount, debitAccount } = await import('../services/ledgerService.js');
    const { generateReference } = await import('../utils/generators.js');
    const reference = generateReference();

    const result = await prisma.$transaction(async (tx) => {
      const debit = await debitAccount(tx, {
        accountId: fromAcc.id,
        amount: numAmount,
        currency: fromAcc.currency,
        type: 'SAVINGS_TRANSFER',
        description: direction === 'TO_SAVINGS' ? 'Transfer to Savings' : 'Transfer from Savings to Checking',
        reference: `${reference}-DR`,
        userId: req.auth!.userId,
      });

      const credit = await creditAccount(tx, {
        accountId: toAcc.id,
        amount: numAmount,
        currency: toAcc.currency,
        type: 'SAVINGS_TRANSFER',
        description: direction === 'TO_SAVINGS' ? 'Deposit from Checking' : 'Withdrawal to Checking',
        reference: `${reference}-CR`,
        userId: req.auth!.userId,
      });

      return { debit, credit };
    }, { timeout: 20000 });

    res.json({ message: 'Savings transfer completed successfully.', result });
  } catch (e) {
    next(e);
  }
});

router.post('/fixed-deposits', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const { amount, durationMonths, pin } = req.body;
    const numAmount = Number(amount);
    const months = Number(durationMonths);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Valid amount required' });
    if (![3, 6, 12, 24].includes(months)) return res.status(400).json({ error: 'Duration must be 3, 6, 12, or 24 months' });

    const { verifyPin } = await import('../services/pinService.js');
    if (pin) await verifyPin(req.auth!.userId, pin);

    const [checking, fdAccount] = await Promise.all([
      prisma.account.findFirst({ where: { userId: req.auth!.userId, type: 'CHECKING', status: 'ACTIVE' } }),
      prisma.account.findFirst({ where: { userId: req.auth!.userId, type: 'FIXED_DEPOSIT', status: 'ACTIVE' } }),
    ]);

    if (!checking || !fdAccount) return res.status(400).json({ error: 'Checking or Fixed Deposit account not found' });
    if (checking.availableBalance < numAmount) return res.status(400).json({ error: 'Insufficient funds in checking account' });

    const rates: Record<number, number> = { 3: 6.5, 6: 8.5, 12: 11.0, 24: 14.5 };
    const rate = rates[months] || 8.5;
    const expectedMaturityValue = numAmount * (1 + (rate / 100) * (months / 12));

    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + months);

    const { creditAccount, debitAccount } = await import('../services/ledgerService.js');
    const { generateReference } = await import('../utils/generators.js');
    const reference = generateReference();

    const result = await prisma.$transaction(async (tx) => {
      await debitAccount(tx, {
        accountId: checking.id,
        amount: numAmount,
        currency: checking.currency,
        type: 'FIXED_DEPOSIT_FUNDING',
        description: `Fixed Deposit Booking (${months} Months @ ${rate}%)`,
        reference: `${reference}-DR`,
        userId: req.auth!.userId,
      });

      await creditAccount(tx, {
        accountId: fdAccount.id,
        amount: numAmount,
        currency: fdAccount.currency,
        type: 'FIXED_DEPOSIT_FUNDING',
        description: `Fixed Deposit Principal (${months} Months @ ${rate}%)`,
        reference: `${reference}-CR`,
        userId: req.auth!.userId,
      });

      const fixedDeposit = await tx.fixedDeposit.create({
        data: {
          userId: req.auth!.userId,
          accountId: fdAccount.id,
          principal: numAmount,
          currency: checking.currency,
          durationMonths: months,
          interestRate: rate,
          expectedMaturityValue,
          startDate,
          maturityDate,
          status: 'ACTIVE',
        },
      });

      return fixedDeposit;
    }, { timeout: 20000 });

    res.status(201).json({ message: 'Fixed Deposit created successfully.', fixedDeposit: result });
  } catch (e) {
    next(e);
  }
});

export default router;
