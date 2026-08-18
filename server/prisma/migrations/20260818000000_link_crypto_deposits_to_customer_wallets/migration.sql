-- Safe additive migration: existing deposits keep walletId NULL and remain untouched.
ALTER TABLE "CryptoDeposit" ADD COLUMN "walletId" TEXT;
CREATE INDEX "CryptoDeposit_walletId_idx" ON "CryptoDeposit"("walletId");
