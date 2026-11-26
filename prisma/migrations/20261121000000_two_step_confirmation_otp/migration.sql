/* Two-sided delivery/return confirmation with OTP.
   Additive only: new nullable timestamp columns on "Reservation", a new
   "depositStatus" column with a safe default, and the new "ReservationOtp"
   table. No data is dropped, rewritten or reset — existing reservations keep
   their rows and statuses untouched. */

-- AlterTable: OTP confirmation timeline + deposit refund pipeline
ALTER TABLE "Reservation"
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "actualStartAt" TIMESTAMP(3),
  ADD COLUMN "returnRequestedAt" TIMESTAMP(3),
  ADD COLUMN "returnConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "disputeOpenedAt" TIMESTAMP(3),
  ADD COLUMN "depositStatus" TEXT NOT NULL DEFAULT 'NONE';

-- CreateTable: hashed, single-use, stage-bound one-time codes
CREATE TABLE "ReservationOtp" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationOtp_reservationId_userId_stage_createdAt_idx" ON "ReservationOtp"("reservationId", "userId", "stage", "createdAt");

-- AddForeignKey
ALTER TABLE "ReservationOtp" ADD CONSTRAINT "ReservationOtp_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
