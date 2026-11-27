/* Record user registration consents on User: the 18+ age self-declaration and
   the TOS/privacy acceptance, with the exact acceptance time. Null = consent
   not recorded (accounts created before this change). */
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ageConfirmedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tosAcceptedAt" TIMESTAMP(3);
