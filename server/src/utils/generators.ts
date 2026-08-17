import { v4 as uuidv4 } from 'uuid';

export function generateReference(prefix = 'NEXA'): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;
}

export function generateApplicationId(): string {
  return `APP-${Date.now().toString(36).toUpperCase()}`;
}

export async function generateAccountNumber(
  countryCode: string,
  prisma: { account: { findUnique: (args: { where: { accountNumber: string } }) => Promise<unknown | null> } }
): Promise<string> {
  let attempts = 0;
  while (attempts < 100) {
    const seq = Math.floor(10000000 + Math.random() * 90000000);
    const num = `NEXA-${countryCode}-${seq}`;
    const existing = await prisma.account.findUnique({ where: { accountNumber: num } });
    if (!existing) return num;
    attempts++;
  }
  throw new Error('Unable to generate unique account number');
}

export function generateMaskedCardNumber(): string {
  const last4 = Math.floor(1000 + Math.random() * 9000).toString();
  return `**** **** **** ${last4}`;
}

export function getCardLast4(masked: string): string {
  return masked.replace(/\D/g, '').slice(-4);
}
