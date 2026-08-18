import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const adminEmail = process.env.ADMIN_EMAIL || 'nexaowner@nexa.com';

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) throw new Error('Admin account not found. Run seed first.');

  // Delete in dependency order
  await prisma.supportReply.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany({ where: { userId: { not: admin.id } } });
  await prisma.notification.deleteMany({ where: { user: { role: 'CUSTOMER' } } });
  await prisma.cardTransaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.cardRequest.deleteMany();
  await prisma.loanRepayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.loanApplication.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();

  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' } });
  for (const c of customers) {
    await prisma.pinCredential.deleteMany({ where: { userId: c.id } });
    await prisma.accountApplication.deleteMany({ where: { userId: c.id } });
    await prisma.account.deleteMany({ where: { userId: c.id } });
    await prisma.userProfile.deleteMany({ where: { userId: c.id } });
    await prisma.user.delete({ where: { id: c.id } });
  }

  // Clean admin notifications too for fresh start
  await prisma.notification.deleteMany();

  console.log('Database cleaned. Admin account preserved.');
  console.log(`Customers remaining: ${await prisma.user.count({ where: { role: 'CUSTOMER' } })}`);
  console.log(`Transactions remaining: ${await prisma.transaction.count()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
