-- CreateEnum
CREATE TYPE "BonusTransactionType" AS ENUM ('EARN', 'REDEEM', 'REFUND', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "bonusRedeemable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "bonusDiscountMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bonusEarnedAt" TIMESTAMP(3),
ADD COLUMN     "bonusPointsEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bonusPointsRedeemed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BonusWallet" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "BonusTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "orderId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "earnPercent" INTEGER NOT NULL DEFAULT 5,
    "maxRedeemPercent" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BonusWallet_phone_key" ON "BonusWallet"("phone");

-- CreateIndex
CREATE INDEX "BonusTransaction_walletId_idx" ON "BonusTransaction"("walletId");

-- CreateIndex
CREATE INDEX "BonusTransaction_orderId_idx" ON "BonusTransaction"("orderId");

-- AddForeignKey
ALTER TABLE "BonusTransaction" ADD CONSTRAINT "BonusTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "BonusWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusTransaction" ADD CONSTRAINT "BonusTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
