/* Remove the electronic promissory-note guarantee columns from Reservation
   and add the admin percent ruling to DamageClaim. */
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "saktehSignature";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "saktehSignedAt";
ALTER TABLE "DamageClaim" ADD COLUMN IF NOT EXISTS "percentToRenter" INTEGER;
