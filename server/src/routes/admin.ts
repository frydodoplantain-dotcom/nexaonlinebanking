import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getCurrencyForCountry } from '../config/countries.js';
import { generateApplicationId, generateReference, generateMaskedCardNumber } from '../utils/generators.js';
import { createAccountsForUser, adminAdjustBalance, creditAccount, debitAccount } from '../services/ledgerService.js';
import { createAuditLog } from '../services/auditService.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';
import { resetPin, updatePinState, hashPin } from '../services/pinService.js';
import { getSettings, setSetting } from '../services/settingsService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

// Overview
router.get('/overview', async (_req, res, next) => {
  try {
    const [
      totalCustomers, activeCustomers, pendingApplications, suspendedCustomers,
      totalTransactions, totalTransfers, pendingTransfers, totalLoans, activeLoans,
      totalCards, totalBalance, recentActivity,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER', status: 'ACTIVE' } }),
      prisma.accountApplication.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'CUSTOMER', status: 'SUSPENDED' } }),
      prisma.transaction.count(),
      prisma.transfer.count(),
      prisma.transfer.count({ where: { status: 'PENDING' } }),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: { in: ['ACTIVE', 'OVERDUE'] } } }),
      prisma.card.count({ where: { status: { in: ['ACTIVE', 'FROZEN'] } } }),
      prisma.account.aggregate({ _sum: { balance: true } }),
      prisma.transaction.groupBy({ by: ['createdAt'], _count: true, orderBy: { createdAt: 'desc' }, take: 30 }).catch(() => []),
    ]);

    const monthlyTxns = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT strftime('%Y-%m', createdAt) as month, COUNT(*) as count
      FROM Transaction GROUP BY month ORDER BY month DESC LIMIT 12
    `.catch(() => []);

    res.json({
      totalCustomers, activeCustomers, pendingApplications, suspendedCustomers,
      totalTransactions, totalTransfers, pendingTransfers, totalLoans, activeLoans,
      totalCards, totalBalance: totalBalance._sum.balance ?? 0,
      chartData: monthlyTxns.reverse(),
    });
  } catch (e) {
    next(e);
  }
});

// Pending Actions Center
router.get('/pending-actions', async (_req, res, next) => {
  try {
    const [
      pendingTransfers,
      pendingApplications,
      pendingLoans,
      pendingCryptoDeposits,
      pendingSupportTickets,
      pendingKyc,
      pendingCards,
    ] = await Promise.all([
      prisma.transfer.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.accountApplication.count({ where: { status: 'PENDING' } }),
      prisma.loanApplication.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.cryptoDeposit.count({ where: { status: 'PENDING' } }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.userProfile.count({ where: { kycStatus: 'PENDING', idDocumentPath: { not: null } } }),
      prisma.cardRequest.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      pendingTransfers,
      pendingApplications,
      pendingLoans,
      pendingCryptoDeposits,
      pendingSupportTickets,
      pendingKyc,
      pendingCards,
      totalPending: pendingTransfers + pendingApplications + pendingLoans + pendingCryptoDeposits + pendingSupportTickets + pendingKyc + pendingCards,
    });
  } catch (e) {
    next(e);
  }
});

// Admin Crypto Assets Management
router.get('/crypto/assets', async (_req, res, next) => {
  try {
    const assets = await prisma.cryptoAsset.findMany({ orderBy: { symbol: 'asc' } });
    res.json(assets);
  } catch (e) {
    next(e);
  }
});

router.post('/crypto/assets', async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      symbol: z.string().min(1).toLowerCase(),
      network: z.string().min(1),
      depositAddress: z.string().min(1),
      status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
      instructions: z.string().optional(),
    }).parse(req.body);

    const asset = await prisma.cryptoAsset.upsert({
      where: { symbol: data.symbol },
      update: data,
      create: data,
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'UPDATE_CRYPTO_ASSET',
      targetType: 'CryptoAsset',
      targetId: asset.id,
      newValue: data,
      req,
    });

    res.json(asset);
  } catch (e) {
    next(e);
  }
});

router.patch('/crypto/assets/:id', async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().optional(),
      network: z.string().optional(),
      depositAddress: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      instructions: z.string().optional(),
    }).parse(req.body);

    const asset = await prisma.cryptoAsset.update({
      where: { id: req.params.id },
      data,
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: 'UPDATE_CRYPTO_ASSET',
      targetType: 'CryptoAsset',
      targetId: asset.id,
      newValue: data,
      req,
    });

    res.json(asset);
  } catch (e) {
    next(e);
  }
});

// Admin Crypto Deposits Review
router.get('/crypto/deposits', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;

    const deposits = await prisma.cryptoDeposit.findMany({
      where,
      include: { user: { include: { profile: true } }, asset: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(deposits);
  } catch (e) {
    next(e);
  }
});

router.post('/crypto/deposits/:id/review', async (req, res, next) => {
  try {
    const { status, adminNotes } = z.object({
      status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
      adminNotes: z.string().optional(),
    }).parse(req.body);

    if (['REJECTED', 'SUSPENDED'].includes(status) && !adminNotes) {
      return res.status(400).json({ error: 'Reason (adminNotes) is required for rejection/suspension' });
    }

    const deposit = await prisma.cryptoDeposit.findUnique({
      where: { id: req.params.id },
      include: { asset: true, user: true },
    });

    if (!deposit) return res.status(404).json({ error: 'Crypto deposit request not found' });

    if (deposit.status === 'APPROVED') {
      return res.status(400).json({ error: 'Deposit request has already been approved' });
    }

    const updated = await prisma.cryptoDeposit.update({
      where: { id: deposit.id },
      data: { status, adminNotes },
    });

    if (status === 'APPROVED') {
      // Find or create Crypto account for user
      let cryptoAcc = await prisma.account.findFirst({
        where: { userId: deposit.userId, type: 'CRYPTO' },
      });

      if (!cryptoAcc) {
        // Fallback to checking account if no crypto account exists
        cryptoAcc = await prisma.account.findFirst({
          where: { userId: deposit.userId, type: 'CHECKING' },
        });
      }

      if (cryptoAcc) {
        await prisma.$transaction(async (tx) => {
          await creditAccount(tx, {
            accountId: cryptoAcc!.id,
            amount: deposit.amount,
            currency: deposit.asset.symbol.toUpperCase(),
            type: 'DEPOSIT',
            description: `Crypto Deposit - ${deposit.asset.name} (${deposit.asset.symbol.toUpperCase()})`,
            userId: deposit.userId,
            createdById: req.auth!.userId,
          });
        });
      }
    }

    await createNotification({
      userId: deposit.userId,
      title: `Crypto Deposit ${status}`,
      message: `Your deposit of ${deposit.amount} ${deposit.asset.symbol.toUpperCase()} has been ${status.toLowerCase()}.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
      type: 'SYSTEM',
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `CRYPTO_DEPOSIT_${status}`,
      targetType: 'CryptoDeposit',
      targetId: deposit.id,
      reason: adminNotes,
      req,
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// Applications
router.get('/applications', async (req, res, next) => {
  try {
    const { search, status, country, page = '1', limit = '20', sort = 'newest' } = req.query;
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { applicationId: { contains: search as string } },
        { user: { email: { contains: (search as string).toLowerCase() } } },
        { user: { profile: { firstName: { contains: search as string } } } },
        { user: { profile: { lastName: { contains: search as string } } } },
        { user: { profile: { phone: { contains: search as string } } } },
        { user: { accounts: { some: { accountNumber: { contains: search as string } } } } },
      ];
    }
    if (country) where.user = { profile: { country: country as string } };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const orderBy = sort === 'oldest' ? { createdAt: 'asc' as const } : sort === 'name' ? { user: { profile: { firstName: 'asc' as const } } } : { createdAt: 'desc' as const };

    const [items, total] = await Promise.all([
      prisma.accountApplication.findMany({
        where: where as object,
        include: { user: { include: { profile: true, accounts: true } } },
        orderBy: orderBy as object,
        skip,
        take: parseInt(limit as string),
      }),
      prisma.accountApplication.count({ where: where as object }),
    ]);
    res.json({ items, total, page: parseInt(page as string) });
  } catch (e) {
    next(e);
  }
});

router.post('/applications/:id/approve', async (req, res, next) => {
  try {
    const app = await prisma.accountApplication.findUnique({
      where: { id: req.params.id },
      include: { user: { include: { profile: true } } },
    });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    const currency = getCurrencyForCountry(app.user.profile!.country);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: app.userId }, data: { status: 'ACTIVE' } });
      await tx.accountApplication.update({ where: { id: app.id }, data: { status: 'APPROVED', reviewedById: req.auth!.userId, reviewedAt: new Date() } });
    });

    await createAccountsForUser(app.userId, app.user.profile!.country, currency, app.user.profile!.accountType);

    await createNotification({ userId: app.userId, title: 'Account approved', message: 'Your NEXA account has been approved. You can now log in.', type: 'ACCOUNT' });
    await createAuditLog({ actorId: req.auth!.userId, action: 'APPROVE_APPLICATION', targetType: 'AccountApplication', targetId: app.id, previousValue: { status: 'PENDING' }, newValue: { status: 'APPROVED' }, req });

    res.json({ message: 'Application approved' });
  } catch (e) {
    next(e);
  }
});

router.post('/applications/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const app = await prisma.accountApplication.findUnique({ where: { id: req.params.id } });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    await prisma.$transaction([
      prisma.user.update({ where: { id: app.userId }, data: { status: 'REJECTED' } }),
      prisma.accountApplication.update({ where: { id: app.id }, data: { status: 'REJECTED', adminNotes: reason, reviewedById: req.auth!.userId, reviewedAt: new Date() } }),
    ]);
    await createNotification({ userId: app.userId, title: 'Application rejected', message: reason || 'Your account application was not approved.', type: 'ACCOUNT' });
    await createAuditLog({ actorId: req.auth!.userId, action: 'REJECT_APPLICATION', targetType: 'AccountApplication', targetId: app.id, reason, req });
    res.json({ message: 'Application rejected' });
  } catch (e) {
    next(e);
  }
});

// Users
router.get('/users', async (req, res, next) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = { role: 'CUSTOMER' };
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: (search as string).toLowerCase() } },
        { profile: { firstName: { contains: search as string } } },
        { profile: { lastName: { contains: search as string } } },
        { profile: { phone: { contains: search as string } } },
        { accounts: { some: { accountNumber: { contains: search as string } } } },
      ];
    }
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, include: { profile: true, accounts: true }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit as string) }),
      prisma.user.count({ where }),
    ]);
    res.json({ items, total });
  } catch (e) {
    next(e);
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        profile: true,
        accounts: true,
        pinCredential: { select: { enabled: true, locked: true, mustChange: true, failedAttempts: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        loans: true,
        cards: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const transfers = await prisma.transfer.findMany({
      where: { OR: [{ senderUserId: user.id }, { recipientUserId: user.id }] },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const auditLogs = await prisma.auditLog.findMany({
      where: { OR: [{ targetId: user.id }, { actorId: user.id }] },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ user, transfers, auditLogs });
  } catch (e) {
    next(e);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const data = z.object({
      firstName: z.string(), middleName: z.string().optional(), lastName: z.string(),
      email: z.string().email(), phone: z.string().optional(), dateOfBirth: z.string().optional(),
      gender: z.string().optional(), country: z.string(), state: z.string().optional(),
      city: z.string().optional(), address: z.string().optional(), zip: z.string().optional(),
      accountType: z.enum(['CHECKING', 'SAVINGS', 'FIXED_DEPOSIT']).default('CHECKING'),
      status: z.enum(['ACTIVE', 'PENDING']).default('ACTIVE'),
      password: z.string().min(6), pin: z.string().length(4).optional(),
      openingBalance: z.number().default(0),
    }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const passwordHash = await bcrypt.hash(data.password, 12);
    const currency = getCurrencyForCountry(data.country);
    const pinHash = data.pin ? await hashPin(data.pin) : await hashPin('0000');

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'CUSTOMER',
        status: data.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
        profile: {
          create: {
            firstName: data.firstName, middleName: data.middleName, lastName: data.lastName,
            phone: data.phone, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender, country: data.country, state: data.state, city: data.city,
            address: data.address, zip: data.zip, accountType: data.accountType,
          },
        },
        pinCredential: { create: { pinHash } },
        applications: { create: { applicationId: generateApplicationId(), status: 'APPROVED', reviewedById: req.auth!.userId, reviewedAt: new Date() } },
      },
      include: { profile: true },
    });

    if (data.status === 'ACTIVE') {
      const accounts = await createAccountsForUser(user.id, data.country, currency, data.accountType);
      if (data.openingBalance > 0) {
        const checking = accounts.find((a) => a.type === 'CHECKING') ?? accounts[0];
        await adminAdjustBalance({
          accountId: checking.id,
          amount: data.openingBalance,
          direction: 'ADD',
          description: 'Opening balance',
          reason: 'Admin created customer with opening balance',
          source: 'Admin',
          adminId: req.auth!.userId,
          req,
        });
      }
    }

    await createAuditLog({ actorId: req.auth!.userId, action: 'CREATE_CUSTOMER', targetType: 'User', targetId: user.id, newValue: { email: user.email }, req });
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const before = await prisma.user.findUnique({ where: { id: req.params.id }, include: { profile: true } });
    if (!before) return res.status(404).json({ error: 'User not found' });
    const { status, ...profileData } = req.body;
    if (status) await prisma.user.update({ where: { id: req.params.id }, data: { status } });
    if (Object.keys(profileData).length) {
      await prisma.userProfile.update({ where: { userId: req.params.id }, data: profileData });
    }
    const after = await prisma.user.findUnique({ where: { id: req.params.id }, include: { profile: true } });
    await createAuditLog({ actorId: req.auth!.userId, action: 'UPDATE_USER', targetType: 'User', targetId: req.params.id, previousValue: before, newValue: after, req });
    res.json(after);
  } catch (e) {
    next(e);
  }
});

router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { status: 'SUSPENDED' } });
    await createAuditLog({ actorId: req.auth!.userId, action: 'SUSPEND_USER', targetType: 'User', targetId: req.params.id, req });
    res.json({ message: 'User suspended' });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:id/activate', async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
    await createAuditLog({ actorId: req.auth!.userId, action: 'ACTIVATE_USER', targetType: 'User', targetId: req.params.id, req });
    res.json({ message: 'User activated' });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
    await createAuditLog({ actorId: req.auth!.userId, action: 'RESET_PASSWORD', targetType: 'User', targetId: req.params.id, req });
    res.json({ message: 'Password reset successfully' });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:id/pin/reset', async (req, res, next) => {
  try {
    const { pin } = z.object({ pin: z.string().length(4) }).parse(req.body);
    await resetPin(req.params.id, pin, req.auth!.userId, req);
    res.json({ message: 'PIN reset successfully' });
  } catch (e) {
    next(e);
  }
});

router.patch('/users/:id/pin/state', async (req, res, next) => {
  try {
    const updates = z.object({ enabled: z.boolean().optional(), locked: z.boolean().optional(), mustChange: z.boolean().optional() }).parse(req.body);
    await updatePinState(req.params.id, updates, req.auth!.userId, req);
    res.json({ message: 'PIN state updated' });
  } catch (e) {
    next(e);
  }
});

// Balance management
router.post('/accounts/:id/add-funds', async (req, res, next) => {
  try {
    const data = z.object({
      amount: z.number().positive(), description: z.string(), reason: z.string(),
      source: z.string().optional(), reference: z.string().optional(),
    }).parse(req.body);
    const result = await adminAdjustBalance({
      accountId: req.params.id, amount: data.amount, direction: 'ADD',
      description: data.description, reason: data.reason, source: data.source,
      reference: data.reference, adminId: req.auth!.userId, req,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/accounts/:id/remove-funds', async (req, res, next) => {
  try {
    const data = z.object({
      amount: z.number().positive(), description: z.string(), reason: z.string(),
      source: z.string().optional(), reference: z.string().optional(),
    }).parse(req.body);
    const result = await adminAdjustBalance({
      accountId: req.params.id, amount: data.amount, direction: 'REMOVE',
      description: data.description, reason: data.reason, source: data.source,
      reference: data.reference, adminId: req.auth!.userId, req,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Transactions
router.get('/transactions', async (req, res, next) => {
  try {
    const { search, status, type, currency, page = '1', limit = '20', from, to } = req.query;
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.type = type;
    if (currency) where.currency = currency;
    if (from || to) where.createdAt = { ...(from ? { gte: new Date(from as string) } : {}), ...(to ? { lte: new Date(to as string) } : {}) };
    if (search) {
      where.OR = [
        { reference: { contains: search as string } },
        { senderName: { contains: search as string } },
        { recipientName: { contains: search as string } },
        { description: { contains: search as string } },
        { user: { email: { contains: (search as string).toLowerCase() } } },
        { account: { accountNumber: { contains: search as string } } },
      ];
    }
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({ where, include: { user: { include: { profile: true } }, account: true }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit as string) }),
      prisma.transaction.count({ where }),
    ]);
    res.json({ items, total });
  } catch (e) {
    next(e);
  }
});

router.post('/transactions', async (req, res, next) => {
  try {
    const data = z.object({
      userId: z.string(), accountId: z.string(), type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND', 'INTEREST', 'FEE', 'ADJUSTMENT']),
      amount: z.number().positive(), currency: z.string(), description: z.string().optional(),
      reference: z.string().optional(), status: z.enum(['COMPLETED', 'PENDING', 'FAILED']).default('COMPLETED'),
      senderName: z.string().optional(), senderBank: z.string().optional(), senderAccount: z.string().optional(), senderCountry: z.string().optional(),
      recipientName: z.string().optional(), recipientBank: z.string().optional(), recipientAccount: z.string().optional(), recipientCountry: z.string().optional(),
      direction: z.enum(['CREDIT', 'DEBIT']),
    }).parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const fn = data.direction === 'CREDIT' ? creditAccount : debitAccount;
      return fn(tx, {
        accountId: data.accountId, amount: data.amount, currency: data.currency,
        type: data.type, description: data.description, reference: data.reference,
        userId: data.userId, createdById: req.auth!.userId,
        senderName: data.senderName, senderBank: data.senderBank, senderAccount: data.senderAccount, senderCountry: data.senderCountry,
        recipientName: data.recipientName, recipientBank: data.recipientBank, recipientAccount: data.recipientAccount, recipientCountry: data.recipientCountry,
        status: data.status,
      });
    });

    await createAuditLog({ actorId: req.auth!.userId, action: 'CREATE_TRANSACTION', targetType: 'Transaction', targetId: result.transaction.id, newValue: data, req });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

// Transfers admin
router.get('/transfers', async (req, res, next) => {
  try {
    const { status, type, search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.type = type;
    if (search) where.OR = [{ reference: { contains: search as string } }, { externalAccountName: { contains: search as string } }];
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [items, total] = await Promise.all([
      prisma.transfer.findMany({ where, include: { senderUser: { include: { profile: true } }, recipientUser: { include: { profile: true } }, fromAccount: true, toAccount: true }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit as string) }),
      prisma.transfer.count({ where }),
    ]);
    res.json({ items, total });
  } catch (e) {
    next(e);
  }
});

router.patch('/transfers/:id/status', async (req, res, next) => {
  try {
    const { status, adminNotes } = z.object({
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED']),
      adminNotes: z.string().optional(),
    }).parse(req.body);

    const before = await prisma.transfer.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ error: 'Transfer not found' });

    const transfer = await prisma.transfer.update({
      where: { id: req.params.id },
      data: { status, adminNotes, processedById: req.auth!.userId, processedAt: new Date() },
    });

    if (before.type === 'EXTERNAL' && status === 'REJECTED') {
      // Refund on rejection
      const txn = await prisma.transaction.findFirst({ where: { transferId: before.id, status: 'PENDING' } });
      if (txn && before.fromAccountId) {
        await prisma.$transaction(async (tx) => {
          await creditAccount(tx, {
            accountId: before.fromAccountId!,
            amount: before.amount + before.fee,
            currency: before.currency,
            type: 'REFUND',
            description: 'External transfer rejected - refund',
            userId: before.senderUserId,
            createdById: req.auth!.userId,
            transferId: before.id,
          });
          await tx.transaction.updateMany({ where: { transferId: before.id, status: 'PENDING' }, data: { status: 'CANCELLED' } });
        });
      }
    }

    if (before.type === 'EXTERNAL' && status === 'COMPLETED') {
      await prisma.transaction.updateMany({ where: { transferId: before.id, status: 'PENDING' }, data: { status: 'COMPLETED' } });
    }

    await createNotification({ userId: before.senderUserId, title: 'Transfer status updated', message: `Your transfer ${before.reference} is now ${status.toLowerCase().replace('_', ' ')}.`, type: 'TRANSFER', relatedId: before.id });
    await createAuditLog({ actorId: req.auth!.userId, action: 'UPDATE_TRANSFER_STATUS', targetType: 'Transfer', targetId: before.id, previousValue: { status: before.status }, newValue: { status }, reason: adminNotes, req });

    res.json(transfer);
  } catch (e) {
    next(e);
  }
});

router.post('/transfers/incoming', async (req, res, next) => {
  try {
    const data = z.object({
      accountId: z.string(), amount: z.number().positive(), currency: z.string(),
      senderName: z.string(), senderBank: z.string().optional(), senderAccount: z.string().optional(),
      senderCountry: z.string().optional(), reference: z.string().optional(), description: z.string().optional(),
    }).parse(req.body);

    const account = await prisma.account.findUniqueOrThrow({ where: { id: data.accountId }, include: { user: true } });
    const reference = data.reference ?? generateReference('IN');

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.create({
        data: {
          reference, type: 'INCOMING_EXTERNAL', status: 'COMPLETED',
          senderUserId: account.userId, fromAccountId: account.id,
          amount: data.amount, currency: data.currency, purpose: data.description,
          externalAccountName: data.senderName, externalBankName: data.senderBank,
          externalAccountNum: data.senderAccount, externalCountry: data.senderCountry,
          processedById: req.auth!.userId, processedAt: new Date(),
        },
      });
      const credit = await creditAccount(tx, {
        accountId: account.id, amount: data.amount, currency: data.currency,
        type: 'DEPOSIT', description: data.description ?? `Incoming from ${data.senderName}`,
        reference, userId: account.userId, createdById: req.auth!.userId,
        senderName: data.senderName, senderBank: data.senderBank, senderAccount: data.senderAccount,
        senderCountry: data.senderCountry, transferId: transfer.id,
      });
      return { transfer, credit };
    });

    await createNotification({ userId: account.userId, title: 'Incoming funds credited', message: `${data.currency} ${data.amount} has been credited to your account.`, type: 'TRANSFER' });
    await createAuditLog({ actorId: req.auth!.userId, action: 'INCOMING_EXTERNAL_FUNDS', targetType: 'Transfer', targetId: result.transfer.id, req });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

// Loans admin
router.get('/loans/applications', async (req, res, next) => {
  try {
    const apps = await prisma.loanApplication.findMany({ include: { user: { include: { profile: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(apps);
  } catch (e) {
    next(e);
  }
});

router.post('/loans/applications/:id/approve', async (req, res, next) => {
  try {
    const app = await prisma.loanApplication.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const totalInterest = app.amount * (app.interestRate / 100) * (app.duration / 12);
    const totalRepayment = app.amount + totalInterest + app.processingFee;
    const monthlyPayment = totalRepayment / app.duration;

    const loan = await prisma.$transaction(async (tx) => {
      await tx.loanApplication.update({ where: { id: app.id }, data: { status: 'APPROVED', reviewedById: req.auth!.userId, reviewedAt: new Date() } });
      return tx.loan.create({
        data: {
          userId: app.userId, applicationId: app.id, principal: app.amount,
          currency: app.currency || 'USD',
          interestRate: app.interestRate, processingFee: app.processingFee, duration: app.duration,
          monthlyPayment, totalRepayment, remainingBalance: totalRepayment,
          status: 'ACTIVE', purpose: app.purpose, disbursedAt: new Date(),
        },
      });
    });

    // Disburse to checking account
    const account = await prisma.account.findFirst({ where: { userId: app.userId, type: 'CHECKING' } });
    if (account) {
      await adminAdjustBalance({
        accountId: account.id, amount: app.amount, direction: 'ADD',
        description: 'Loan disbursement', reason: 'Loan approved', source: 'NEXA Loans',
        adminId: req.auth!.userId, req,
      });
    }

    await createNotification({ userId: app.userId, title: 'Loan approved', message: `Your loan of ${app.amount} has been approved.`, type: 'LOAN', relatedId: loan.id });
    await createAuditLog({ actorId: req.auth!.userId, action: 'APPROVE_LOAN', targetType: 'Loan', targetId: loan.id, req });
    res.json(loan);
  } catch (e) {
    next(e);
  }
});

router.post('/loans/applications/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    await prisma.loanApplication.update({ where: { id: req.params.id }, data: { status: 'REJECTED', adminNotes: reason, reviewedById: req.auth!.userId, reviewedAt: new Date() } });
    const app = await prisma.loanApplication.findUnique({ where: { id: req.params.id } });
    if (app) await createNotification({ userId: app.userId, title: 'Loan rejected', message: reason || 'Your loan application was not approved.', type: 'LOAN' });
    await createAuditLog({ actorId: req.auth!.userId, action: 'REJECT_LOAN', targetType: 'LoanApplication', targetId: req.params.id, reason, req });
    res.json({ message: 'Loan rejected' });
  } catch (e) {
    next(e);
  }
});

router.post('/loans/:id/repayment', async (req, res, next) => {
  try {
    const { amount, notes } = z.object({ amount: z.number().positive(), notes: z.string().optional() }).parse(req.body);
    const loan = await prisma.loan.findUniqueOrThrow({ where: { id: req.params.id } });
    const reference = generateReference('REP');
    const repayment = await prisma.loanRepayment.create({ data: { loanId: loan.id, amount, reference, notes } });
    const newPaid = loan.paidAmount + amount;
    const newRemaining = Math.max(0, loan.remainingBalance - amount);
    await prisma.loan.update({
      where: { id: loan.id },
      data: { paidAmount: newPaid, remainingBalance: newRemaining, status: newRemaining <= 0 ? 'COMPLETED' : loan.status },
    });
    await createAuditLog({ actorId: req.auth!.userId, action: 'LOAN_REPAYMENT', targetType: 'Loan', targetId: loan.id, newValue: { amount }, req });
    res.json(repayment);
  } catch (e) {
    next(e);
  }
});

// Cards admin
router.get('/cards/requests', async (req, res, next) => {
  try {
    const requests = await prisma.cardRequest.findMany({ include: { user: { include: { profile: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(requests);
  } catch (e) {
    next(e);
  }
});

router.post('/cards/requests/:id/issue', async (req, res, next) => {
  try {
    const request = await prisma.cardRequest.findUnique({ where: { id: req.params.id }, include: { user: { include: { profile: true } } } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const maskedNumber = generateMaskedCardNumber();
    const now = new Date();
    const card = await prisma.$transaction(async (tx) => {
      await tx.cardRequest.update({ where: { id: request.id }, data: { status: 'ACTIVE' } });
      return tx.card.create({
        data: {
          userId: request.userId, requestId: request.id, cardType: request.cardType,
          status: 'ACTIVE', maskedNumber,
          cardholder: `${request.user.profile?.firstName} ${request.user.profile?.lastName}`,
          expiryMonth: now.getMonth() + 1, expiryYear: now.getFullYear() + 4,
        },
      });
    });

    await createNotification({ userId: request.userId, title: 'Card issued', message: `Your ${request.cardType.toLowerCase()} card has been issued.`, type: 'CARD', relatedId: card.id });
    await createAuditLog({ actorId: req.auth!.userId, action: 'ISSUE_CARD', targetType: 'Card', targetId: card.id, req });
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.post('/cards/requests/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await prisma.cardRequest.update({ where: { id: req.params.id }, data: { status: 'REJECTED', adminNotes: reason } });
    await createNotification({ userId: request.userId, title: 'Card request rejected', message: reason || 'Your card request was not approved.', type: 'CARD' });
    await createAuditLog({ actorId: req.auth!.userId, action: 'REJECT_CARD', targetType: 'CardRequest', targetId: request.id, req });
    res.json({ message: 'Card request rejected' });
  } catch (e) {
    next(e);
  }
});

router.patch('/cards/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['ACTIVE', 'FROZEN', 'CANCELLED']) }).parse(req.body);
    const card = await prisma.card.update({ where: { id: req.params.id }, data: { status } });
    await createAuditLog({ actorId: req.auth!.userId, action: 'UPDATE_CARD_STATUS', targetType: 'Card', targetId: card.id, newValue: { status }, req });
    res.json(card);
  } catch (e) {
    next(e);
  }
});

// Audit logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { search, action, page = '1', limit = '50' } = req.query;
    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action as string };
    if (search) where.OR = [{ targetId: { contains: search as string } }, { action: { contains: search as string } }];
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, include: { actor: { include: { profile: true } } }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit as string) }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ items, total });
  } catch (e) {
    next(e);
  }
});

// Reports
router.get('/reports', async (req, res, next) => {
  try {
    const { from, to, country, currency } = req.query;
    const dateFilter = from || to ? { createdAt: { ...(from ? { gte: new Date(from as string) } : {}), ...(to ? { lte: new Date(to as string) } : {}) } } : {};
    const [customers, accounts, transactions, transfers, loans, cards] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER', ...dateFilter } }),
      prisma.account.count({ where: currency ? { currency: currency as string } : {} }),
      prisma.transaction.count({ where: { ...dateFilter, ...(currency ? { currency: currency as string } : {}) } }),
      prisma.transfer.count({ where: dateFilter }),
      prisma.loan.count({ where: dateFilter }),
      prisma.card.count({ where: dateFilter }),
    ]);
    res.json({ customers, accounts, transactions, transfers, loans, cards });
  } catch (e) {
    next(e);
  }
});

// Settings
router.get('/settings', async (_req, res, next) => {
  try {
    res.json(await getSettings());
  } catch (e) {
    next(e);
  }
});

router.patch('/settings', async (req, res, next) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await setSetting(key, String(value));
    }
    await createAuditLog({ actorId: req.auth!.userId, action: 'UPDATE_SETTINGS', targetType: 'SystemSettings', newValue: req.body, req });
    res.json(await getSettings());
  } catch (e) {
    next(e);
  }
});

// Support admin
router.get('/support', async (_req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({ include: { user: { include: { profile: true } }, replies: true }, orderBy: { createdAt: 'desc' } });
    res.json(tickets);
  } catch (e) {
    next(e);
  }
});

router.post('/support/:id/reply', async (req, res, next) => {
  try {
    const { message } = z.object({ message: z.string() }).parse(req.body);
    const reply = await prisma.supportReply.create({ data: { ticketId: req.params.id, message, isAdmin: true } });
    await prisma.supportTicket.update({ where: { id: req.params.id }, data: { status: 'IN_PROGRESS' } });
    res.json(reply);
  } catch (e) {
    next(e);
  }
});

router.patch('/support/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']) }).parse(req.body);
    const ticket = await prisma.supportTicket.update({ where: { id: req.params.id }, data: { status } });
    res.json(ticket);
  } catch (e) {
    next(e);
  }
});

// Notifications admin
router.get('/notifications', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { user: { role: 'ADMIN' } }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(notifications);
  } catch (e) {
    next(e);
  }
});

// Enhanced Customer Detail View
router.get('/customers/:id/detail', async (req, res, next) => {
  try {
    const userId = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        pinCredential: true,
        accounts: { include: { fixedDeposits: true } },
        cards: true,
        loans: { include: { repayments: true } },
        loanApplications: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        transfersSent: { orderBy: { createdAt: 'desc' }, take: 20 },
        transfersReceived: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!user) return res.status(404).json({ error: 'Customer not found' });

    const auditLogs = await prisma.auditLog.findMany({
      where: { OR: [{ targetId: userId }, { actorId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json({ ...user, auditLogs });
  } catch (e) {
    next(e);
  }
});

// KYC Verification Queue & Review
router.get('/kyc/pending', async (req, res, next) => {
  try {
    const items = await prisma.userProfile.findMany({
      where: { kycStatus: { in: ['PENDING', 'RESUBMISSION_REQUESTED'] }, idDocumentPath: { not: null } },
      include: { user: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

router.post('/kyc/:userId/verify', async (req, res, next) => {
  try {
    const userId = req.params.userId as string;
    const { status, reason } = req.body;
    if (!['VERIFIED', 'REJECTED', 'RESUBMISSION_REQUESTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid KYC status' });
    }

    const profile = await prisma.userProfile.update({
      where: { userId },
      data: { kycStatus: status, kycRejectionReason: reason || null },
    });

    await createNotification({
      userId,
      title: `KYC Verification ${status}`,
      message: status === 'VERIFIED' ? 'Your KYC identity documents have been verified.' : (reason || `Your KYC status is now ${status}.`),
      type: 'SECURITY',
    });

    await createAuditLog({
      actorId: req.auth!.userId,
      action: `KYC_${status}`,
      targetType: 'UserProfile',
      targetId: profile.id,
      reason,
      req,
    });

    res.json({ message: `KYC status updated to ${status}`, profile });
  } catch (e) {
    next(e);
  }
});

// Fund Savings Account
router.post('/accounts/:accountId/fund-savings', async (req, res, next) => {
  try {
    const accountId = req.params.accountId as string;
    const { amount, description, reason } = req.body;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { user: { include: { profile: true } } },
    });

    const result = await adminAdjustBalance({
      accountId,
      amount: numAmount,
      direction: 'ADD',
      description: description || 'Admin Savings Account Credit',
      reason: reason || 'Savings account deposit adjustment',
      adminId: req.auth!.userId,
      req,
    });

    res.json({ message: 'Savings account funded successfully', result });
  } catch (e) {
    next(e);
  }
});

// Fund / Create Fixed Deposit Account
router.post('/accounts/:accountId/fund-fixed-deposit', async (req, res, next) => {
  try {
    const accountId = req.params.accountId as string;
    const { amount, durationMonths, interestRate, description, reason } = req.body;
    const numAmount = Number(amount);
    const months = Number(durationMonths) || 12;
    const rate = Number(interestRate) || 10.0;

    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { user: { include: { profile: true } } },
    });

    const expectedMaturityValue = numAmount * (1 + (rate / 100) * (months / 12));
    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + months);

    const result = await prisma.$transaction(async (tx) => {
      const adjustment = await creditAccount(tx, {
        accountId,
        amount: numAmount,
        currency: account.currency,
        type: 'FIXED_DEPOSIT_FUNDING',
        description: description || `Admin Fixed Deposit Credit (${months} Months @ ${rate}%)`,
        userId: account.userId,
        createdById: req.auth!.userId,
      });

      const fixedDeposit = await tx.fixedDeposit.create({
        data: {
          userId: account.userId,
          accountId: account.id,
          principal: numAmount,
          currency: account.currency,
          durationMonths: months,
          interestRate: rate,
          expectedMaturityValue,
          startDate,
          maturityDate,
          status: 'ACTIVE',
        },
      });

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'FUND_FIXED_DEPOSIT',
        targetType: 'Account',
        targetId: accountId,
        previousValue: { balance: adjustment.balanceBefore },
        newValue: { balance: adjustment.balanceAfter, fixedDepositId: fixedDeposit.id },
        reason: reason || 'Fixed deposit funding by administrator',
        req,
      }, tx);

      return { adjustment, fixedDeposit };
    }, { timeout: 20000 });

    res.json({ message: 'Fixed Deposit funded successfully', result });
  } catch (e) {
    next(e);
  }
});

// Dynamic Admin Transaction Creation
router.post('/transactions/create', async (req, res, next) => {
  try {
    const {
      accountId,
      type,
      direction,
      amount,
      currency,
      senderName,
      senderAccount,
      senderBank,
      recipientName,
      recipientAccount,
      recipientBank,
      description,
      reference,
      fee,
      notes,
      transactionDate,
      transactionTime,
    } = req.body;

    const numAmount = Number(amount);
    const numFee = Number(fee) || 0;
    if (!accountId || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid Account ID and positive Amount required' });
    }

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { user: true },
    });

    const isCredit = direction === 'CREDIT';
    const txnRef = reference || generateReference();

    let customTxnDate: Date | undefined;
    if (transactionDate) {
      const timeStr = transactionTime || '12:00';
      customTxnDate = new Date(`${transactionDate}T${timeStr}:00`);
      if (isNaN(customTxnDate.getTime())) customTxnDate = undefined;
    }

    const result = await prisma.$transaction(async (tx) => {
      const fn = isCredit ? creditAccount : debitAccount;
      const ledgerResult = await fn(tx, {
        accountId,
        amount: numAmount,
        currency: currency || account.currency,
        type: type || (isCredit ? 'DEPOSIT' : 'WITHDRAWAL'),
        description: description || `${type || 'Transaction'} by Admin`,
        reference: txnRef,
        userId: account.userId,
        createdById: req.auth!.userId,
        senderName,
        senderAccount,
        senderBank,
        recipientName,
        recipientAccount,
        recipientBank,
        fee: numFee,
        transactionDate: customTxnDate,
      });

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'ADMIN_CREATE_TRANSACTION',
        targetType: 'Transaction',
        targetId: ledgerResult.transaction.id,
        newValue: { type, amount: numAmount, reference: txnRef },
        reason: notes || 'Admin transaction creation',
        req,
      }, tx);

      return ledgerResult;
    }, { timeout: 20000 });

    res.status(201).json({ message: 'Transaction created successfully', result });
  } catch (e) {
    next(e);
  }
});

export default router;
