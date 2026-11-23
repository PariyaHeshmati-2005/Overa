-- AlterTable
ALTER TABLE "DamageClaim" ADD COLUMN     "chargeAmount" INTEGER;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "deliveryNote" TEXT,
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
ADD COLUMN     "saktehSignature" TEXT,
ADD COLUMN     "saktehSignedAt" TIMESTAMP(3);
