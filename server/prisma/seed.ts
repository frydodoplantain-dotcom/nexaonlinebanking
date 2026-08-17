import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { initDefaultSettings } from '../src/services/settingsService.js';

const prisma = new PrismaClient();

async function main() {
  await initDefaultSettings();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nexa.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'NexaAdmin2026!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
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
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log('Admin already exists');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
