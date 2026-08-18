import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { initDefaultSettings } from '../src/services/settingsService.js';
const prisma = new PrismaClient();
async function main() {
    await initDefaultSettings();
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
        console.log(`Admin user updated: ${adminEmail}`);
    }
    else {
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
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

