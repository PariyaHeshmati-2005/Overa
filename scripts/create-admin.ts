/**
 * Overa admin bootstrap — production-safe way to create/promote the first
 * platform administrator.
 *
 * Never runs inside deploy pipelines. Execute it manually against the target
 * database, e.g. after configuring DATABASE_URL (local .env or shell export):
 *
 *   ADMIN_PHONE=09120000000 ADMIN_NAME="مدیر اٌوِرا" ADMIN_PASSWORD=… bun run scripts/create-admin.ts
 *
 * Behaviour:
 *  - If the phone number already exists → the account is promoted to admin
 *    (isAdmin = true) and — when ADMIN_PASSWORD is provided — its password is
 *    (re)set. Existing reservations/listings of that real user are untouched.
 *  - If the phone number does not exist → a new admin account is created.
 *  - Requires ADMIN_PASSWORD to be at least 8 characters.
 */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const phoneDigits = (raw: string) =>
  raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\D/g, "");

async function main() {
  const phone = phoneDigits(process.env.ADMIN_PHONE ?? "");
  const name = process.env.ADMIN_NAME?.trim() || "مدیر اٌوِرا";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const email = process.env.ADMIN_EMAIL?.trim() || null;

  if (!/^09\d{9}$/.test(phone)) {
    console.error(
      "ADMIN_PHONE must be a valid Iranian mobile number (09XXXXXXXXX).",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error(
      "ADMIN_PASSWORD must be provided and at least 8 characters long.",
    );
    process.exit(1);
  }

  const data = {
    name,
    email,
    passwordHash: hashPassword(password),
    isAdmin: true,
    kycStatus: "VERIFIED",
  };

  const existing = await db.user.findUnique({ where: { phone } });
  if (existing) {
    await db.user.update({
      where: { phone },
      data: { isAdmin: true, passwordHash: data.passwordHash },
    });
    await db.auditLog.create({
      data: {
        actorId: existing.id,
        action: "ADMIN_PROMOTED",
        entityType: "User",
        entityId: existing.id,
      },
    });
    console.log(
      `Existing account ${phone} (${existing.name}) promoted to admin.`,
    );
  } else {
    const user = await db.user.create({ data: { phone, ...data } });
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ADMIN_CREATED",
        entityType: "User",
        entityId: user.id,
      },
    });
    console.log(`Admin account created: ${phone} (${name}).`);
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
