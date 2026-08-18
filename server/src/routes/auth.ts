import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../middleware/auth.js';
import { getCurrencyForCountry } from '../config/countries.js';
import { generateApplicationId } from '../utils/generators.js';
import { createAuditLog } from '../services/auditService.js';
import { notifyAdmins, createNotification } from '../services/notificationService.js';
import { hashPin } from '../services/pinService.js';

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
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '')}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts. Please try again later.' }, validate: { xForwardedForHeader: false } });

const registerSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().min(2),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  zip: z.string().optional(),
  accountType: z.enum(['CHECKING', 'SAVINGS', 'FIXED_DEPOSIT']).default('CHECKING'),
  password: z.string().min(6),
  pin: z.string().length(4).regex(/^\d+$/),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  idDocumentPath: z.string().optional(),
  photoPath: z.string().optional(),
});

router.post(
  '/register',
  authLimiter,
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'idDocument', maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
      if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedPhotoPath = files?.photo?.[0] ? `/uploads/${files.photo[0].filename}` : data.photoPath || null;
      const uploadedIdDocPath = files?.idDocument?.[0] ? `/uploads/${files.idDocument[0].filename}` : data.idDocumentPath || null;

      const passwordHash = await bcrypt.hash(data.password, 12);
      const pinHash = await hashPin(data.pin);

      const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: data.email.toLowerCase(),
            passwordHash,
            role: 'CUSTOMER',
            status: 'PENDING',
            profile: {
              create: {
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                gender: data.gender,
                country: data.country,
                state: data.state,
                city: data.city,
                address: data.address,
                zip: data.zip,
                accountType: data.accountType,
                idType: data.idType || null,
                idNumber: data.idNumber || null,
                idDocumentPath: uploadedIdDocPath,
                photoPath: uploadedPhotoPath,
                kycStatus: 'PENDING',
              },
            },
            pinCredential: { create: { pinHash } },
          },
          include: { profile: true },
        });

      await tx.accountApplication.create({
        data: {
          applicationId: generateApplicationId(),
          userId: u.id,
          status: 'PENDING',
        },
      });

      return u;
    });

    await notifyAdmins('New account application', `${data.firstName} ${data.lastName} submitted an account application.`, 'ACCOUNT', user.id);
    await createAuditLog({ action: 'REGISTER', targetType: 'User', targetId: user.id, newValue: { email: user.email, status: 'PENDING' }, req });

    res.status(201).json({ message: 'Application submitted successfully. You will be notified once approved.', applicationId: user.id });
  } catch (e) {
    next(e);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.role === 'CUSTOMER' && user.status !== 'ACTIVE') {
      return res.status(403).json({ error: `Your account is ${user.status.toLowerCase().replace('_', ' ')}. Please wait for administrator approval.` });
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    include: { profile: true, pinCredential: { select: { enabled: true, locked: true, mustChange: true } } },
  });
  res.json({ user });
});

router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const token = uuidv4();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      // In production, send email. For internal platform, return token in dev only.
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ message: 'If the email exists, a reset link has been sent.', resetToken: token });
      }
    }
    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token, password } = z.object({ token: z.string(), password: z.string().min(6) }).parse(req.body);
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } }),
    ]);
    await createAuditLog({ action: 'PASSWORD_RESET', targetType: 'User', targetId: resetToken.userId, req });
    res.json({ message: 'Password reset successfully' });
  } catch (e) {
    next(e);
  }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }).parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await createAuditLog({ actorId: user.id, action: 'PASSWORD_CHANGE', targetType: 'User', targetId: user.id, req });
    res.json({ message: 'Password changed successfully' });
  } catch (e) {
    next(e);
  }
});

router.post('/change-pin', requireAuth, async (req, res, next) => {
  try {
    const { currentPin, newPin } = z.object({
      currentPin: z.string().length(4),
      newPin: z.string().length(4).regex(/^\d+$/),
    }).parse(req.body);
    const { verifyPin } = await import('../services/pinService.js');
    await verifyPin(req.auth!.userId, currentPin);
    const pinHash = await hashPin(newPin);
    await prisma.pinCredential.update({
      where: { userId: req.auth!.userId },
      data: { pinHash, mustChange: false },
    });
    await createAuditLog({ actorId: req.auth!.userId, action: 'PIN_CHANGE', targetType: 'User', targetId: req.auth!.userId, req });
    res.json({ message: 'PIN changed successfully' });
  } catch (e) {
    next(e);
  }
});

export default router;
