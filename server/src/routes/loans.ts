import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireActiveCustomer } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getSettings } from '../services/settingsService.js';
import { notifyAdmins } from '../services/notificationService.js';
import { createAuditLog } from '../services/auditService.js';

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `loan-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '')}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get('/settings', requireAuth, async (_req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({
      minAmount: parseFloat(settings.loanMinAmount),
      maxAmount: parseFloat(settings.loanMaxAmount),
      defaultInterest: parseFloat(settings.loanDefaultInterest),
      defaultDuration: parseInt(settings.loanDefaultDuration),
      processingFee: parseFloat(settings.loanProcessingFee),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/', requireAuth, requireActiveCustomer, async (req, res, next) => {
  try {
    const [applications, activeLoans] = await Promise.all([
      prisma.loanApplication.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: 'desc' } }),
      prisma.loan.findMany({ where: { userId: req.auth!.userId }, include: { repayments: true }, orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ applications, loans: activeLoans });
  } catch (e) {
    next(e);
  }
});

router.post('/apply', requireAuth, requireActiveCustomer, upload.single('idDocument'), async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      amount: Number(req.body.amount),
      duration: Number(req.body.duration),
      monthlyIncome: req.body.monthlyIncome ? Number(req.body.monthlyIncome) : undefined,
    };
    const data = z.object({
      amount: z.number().positive(),
      duration: z.number().int().positive(),
      purpose: z.string().min(1),
      employmentStatus: z.string().optional(),
      monthlyIncome: z.number().optional(),
      idType: z.string().optional(),
      idDocumentPath: z.string().optional(),
      photoPath: z.string().optional(),
      familyContactName: z.string().min(1, 'Family contact name is required'),
      familyContactRelationship: z.string().min(1, 'Family contact relationship is required'),
      familyContactPhone: z.string().min(1, 'Family contact phone is required'),
      familyContactEmail: z.string().optional(),
      friendContactName: z.string().min(1, 'Friend contact name is required'),
      friendContactRelationship: z.string().min(1, 'Friend contact relationship is required'),
      friendContactPhone: z.string().min(1, 'Friend contact phone is required'),
      friendContactEmail: z.string().optional(),
    }).parse(payload);

    const uploadedIdDocPath = req.file ? `/uploads/${req.file.filename}` : data.idDocumentPath || null;

    const settings = await getSettings();
    const min = parseFloat(settings.loanMinAmount);
    const max = parseFloat(settings.loanMaxAmount);
    if (data.amount < min || data.amount > max) {
      return res.status(400).json({ error: `Loan amount must be between ${min} and ${max}` });
    }

    const interestRate = parseFloat(settings.loanDefaultInterest);
    const processingFee = parseFloat(settings.loanProcessingFee);

    const checkingAcc = await prisma.account.findFirst({ where: { userId: req.auth!.userId, type: 'CHECKING' } });
    const currency = checkingAcc?.currency || 'USD';

    const application = await prisma.loanApplication.create({
      data: {
        userId: req.auth!.userId,
        amount: data.amount,
        currency,
        duration: data.duration,
        purpose: data.purpose,
        interestRate,
        processingFee,
        status: 'PENDING',
        employmentStatus: data.employmentStatus || null,
        monthlyIncome: data.monthlyIncome || null,
        idType: data.idType || null,
        idDocumentPath: uploadedIdDocPath,
        photoPath: data.photoPath || null,
        familyContactName: data.familyContactName,
        familyContactRelationship: data.familyContactRelationship,
        familyContactPhone: data.familyContactPhone,
        familyContactEmail: data.familyContactEmail || null,
        friendContactName: data.friendContactName,
        friendContactRelationship: data.friendContactRelationship,
        friendContactPhone: data.friendContactPhone,
        friendContactEmail: data.friendContactEmail || null,
      },
    });

    await notifyAdmins('New loan application', `A customer submitted a loan application for ${data.amount}.`, 'LOAN', application.id);
    await createAuditLog({ actorId: req.auth!.userId, action: 'LOAN_APPLY', targetType: 'LoanApplication', targetId: application.id, req });

    res.status(201).json(application);
  } catch (e) {
    next(e);
  }
});

export default router;
