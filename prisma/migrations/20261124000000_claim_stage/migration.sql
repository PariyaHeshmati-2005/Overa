/* DamageClaim.stage — which lifecycle stage the damage was declared at
   (DELIVERY = renter declared at hand-over and received the item anyway;
    RETURN = declared at the return-to-host stage; GENERAL = other/legacy). */
ALTER TABLE "DamageClaim" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'GENERAL';
