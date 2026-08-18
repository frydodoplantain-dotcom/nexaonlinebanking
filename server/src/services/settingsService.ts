import { prisma } from '../lib/prisma.js';

const DEFAULTS: Record<string, string> = {
  transferFeePercent: '0',
  transferFeeMin: '0',
  internalTransferLimit: '10000000',
  virtualCardFee: '5',
  physicalCardFee: '15',
  cardReplacementFee: '10',
  loanMinAmount: '1000',
  loanMaxAmount: '500000',
  loanDefaultInterest: '8',
  loanDefaultDuration: '12',
  loanProcessingFee: '50',
  loanRepaymentFrequency: 'monthly',
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.systemSettings.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? '0';
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.systemSettings.findMany();
  const settings = { ...DEFAULTS };
  for (const row of rows) settings[row.key] = row.value;
  return settings;
}

export async function setSetting(key: string, value: string) {
  await prisma.systemSettings.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

import bcrypt from 'bcryptjs';

export async function initDefaultSettings() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const existing = await prisma.systemSettings.findUnique({ where: { key } });
    if (!existing) await prisma.systemSettings.create({ data: { key, value } });
  }
}

export async function initAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'nexaowner@nexa.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: adminEmail,
        passwordHash,
        status: 'ACTIVE',
      },
    });
    console.log(`Admin user synchronized: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: 'NEXA',
            lastName: 'Administrator',
            country: 'US',
          },
        },
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  }
}


export async function getTransferFee(amount: number): Promise<number> {
  const percent = parseFloat(await getSetting('transferFeePercent'));
  const min = parseFloat(await getSetting('transferFeeMin'));
  if (percent <= 0) return 0;
  return Math.max(min, amount * (percent / 100));
}
