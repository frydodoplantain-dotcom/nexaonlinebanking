import type { Prisma, TransactionType, LedgerDirection } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generateReference } from '../utils/generators.js';
import { createAuditLog } from './auditService.js';

type TxClient = Prisma.TransactionClient;

export async function creditAccount(
  tx: TxClient,
  params: {
    accountId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    description?: string;
    reference?: string;
    userId: string;
    createdById?: string;
    senderName?: string;
    senderBank?: string;
    senderAccount?: string;
    senderCountry?: string;
    recipientName?: string;
    recipientBank?: string;
    recipientAccount?: string;
    recipientCountry?: string;
    transferId?: string;
    fee?: number;
    status?: TransactionType extends any ? import('@prisma/client').TransactionStatus : never;
    transactionDate?: Date;
  }
) {
  const account = await tx.account.findUniqueOrThrow({ where: { id: params.accountId } });
  const effectiveCurrency = params.currency || account.currency;
  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore + params.amount;

  const txnDate = params.transactionDate ?? new Date();

  const transaction = await tx.transaction.create({
    data: {
      reference: params.reference ?? generateReference(),
      userId: params.userId,
      accountId: params.accountId,
      type: params.type,
      amount: params.amount,
      currency: effectiveCurrency,
      fee: params.fee ?? 0,
      status: params.status ?? 'COMPLETED',
      description: params.description,
      senderName: params.senderName,
      senderBank: params.senderBank,
      senderAccount: params.senderAccount,
      senderCountry: params.senderCountry,
      recipientName: params.recipientName,
      recipientBank: params.recipientBank,
      recipientAccount: params.recipientAccount,
      recipientCountry: params.recipientCountry,
      transferId: params.transferId,
      transactionDate: txnDate,
      createdAt: txnDate,
    },
  });

  await tx.account.update({
    where: { id: params.accountId },
    data: { balance: balanceAfter, availableBalance: balanceAfter },
  });

  await tx.ledgerEntry.create({
    data: {
      accountId: params.accountId,
      transactionId: transaction.id,
      direction: 'CREDIT' as LedgerDirection,
      amount: params.amount,
      currency: effectiveCurrency,
      balanceBefore,
      balanceAfter,
      reference: transaction.reference,
      description: params.description,
      createdById: params.createdById,
      createdAt: txnDate,
    },
  });

  return { transaction, balanceBefore, balanceAfter };
}

export async function debitAccount(
  tx: TxClient,
  params: {
    accountId: string;
    amount: number;
    currency?: string;
    type: TransactionType;
    description?: string;
    reference?: string;
    userId: string;
    createdById?: string;
    senderName?: string;
    senderBank?: string;
    senderAccount?: string;
    senderCountry?: string;
    recipientName?: string;
    recipientBank?: string;
    recipientAccount?: string;
    recipientCountry?: string;
    transferId?: string;
    fee?: number;
    status?: TransactionType extends any ? import('@prisma/client').TransactionStatus : never;
    transactionDate?: Date;
  }
) {
  const account = await tx.account.findUniqueOrThrow({ where: { id: params.accountId } });
  const effectiveCurrency = params.currency || account.currency;
  if (account.availableBalance < params.amount) throw new Error('Insufficient balance');
  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore - params.amount;

  const txnDate = params.transactionDate ?? new Date();

  const transaction = await tx.transaction.create({
    data: {
      reference: params.reference ?? generateReference(),
      userId: params.userId,
      accountId: params.accountId,
      type: params.type,
      amount: params.amount,
      currency: effectiveCurrency,
      fee: params.fee ?? 0,
      status: params.status ?? 'COMPLETED',
      description: params.description,
      senderName: params.senderName,
      senderBank: params.senderBank,
      senderAccount: params.senderAccount,
      senderCountry: params.senderCountry,
      recipientName: params.recipientName,
      recipientBank: params.recipientBank,
      recipientAccount: params.recipientAccount,
      recipientCountry: params.recipientCountry,
      transferId: params.transferId,
      transactionDate: txnDate,
      createdAt: txnDate,
    },
  });

  await tx.account.update({
    where: { id: params.accountId },
    data: { balance: balanceAfter, availableBalance: balanceAfter },
  });

  await tx.ledgerEntry.create({
    data: {
      accountId: params.accountId,
      transactionId: transaction.id,
      direction: 'DEBIT' as LedgerDirection,
      amount: params.amount,
      currency: effectiveCurrency,
      balanceBefore,
      balanceAfter,
      reference: transaction.reference,
      description: params.description,
      createdById: params.createdById,
      createdAt: txnDate,
    },
  });

  return { transaction, balanceBefore, balanceAfter };
}

export async function adminAdjustBalance(params: {
  accountId: string;
  amount: number;
  direction: 'ADD' | 'REMOVE';
  description: string;
  reason: string;
  source?: string;
  reference?: string;
  adminId: string;
  req?: import('express').Request;
}) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findUniqueOrThrow({
      where: { id: params.accountId },
      include: { user: { include: { profile: true } } },
    });

    const type = params.direction === 'ADD' ? 'DEPOSIT' : 'WITHDRAWAL';
    const fn = params.direction === 'ADD' ? creditAccount : debitAccount;

    const result = await fn(tx, {
      accountId: params.accountId,
      amount: params.amount,
      currency: account.currency,
      type,
      description: params.description,
      reference: params.reference,
      userId: account.userId,
      createdById: params.adminId,
      senderName: params.direction === 'ADD' ? params.source : undefined,
      recipientName: params.direction === 'REMOVE' ? params.source : undefined,
    });

    await createAuditLog({
      actorId: params.adminId,
      action: params.direction === 'ADD' ? 'ADD_FUNDS' : 'REMOVE_FUNDS',
      targetType: 'Account',
      targetId: params.accountId,
      previousValue: { balance: result.balanceBefore },
      newValue: { balance: result.balanceAfter },
      reason: params.reason,
      req: params.req,
    }, tx);

    return result;
  }, { timeout: 20000 });
}

export async function createAccountsForUser(userId: string, countryCode: string, currency: string, accountType: 'CHECKING' | 'SAVINGS' | 'FIXED_DEPOSIT' = 'CHECKING') {
  const { generateAccountNumber } = await import('../utils/generators.js');
  const types: Array<'CHECKING' | 'SAVINGS' | 'FIXED_DEPOSIT'> = ['CHECKING', 'SAVINGS', 'FIXED_DEPOSIT'];
  const accounts = [];
  for (const type of types) {
    const accountNumber = await generateAccountNumber(countryCode, prisma);
    const account = await prisma.account.create({
      data: { userId, accountNumber, type, currency, balance: 0, availableBalance: 0 },
    });
    accounts.push(account);
  }
  return accounts;
}
