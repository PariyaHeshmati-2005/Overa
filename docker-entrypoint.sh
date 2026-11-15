#!/bin/sh
set -e

# Overa container entrypoint (PostgreSQL edition)
# 1. Apply controlled Prisma migrations (migrate deploy — never destructive).
# 2. Optionally bootstrap the platform admin (ADMIN_PHONE + ADMIN_PASSWORD).
# 3. Optionally seed DEMO content (only when SEED_DEMO=1 — demo data must
#    never be written to a real production database by accident; the seed
#    script itself refuses remote databases unless explicitly overridden).
# 4. Start the Next.js server.

echo "[overa] applying database migrations…"
# NOTE: `prisma migrate deploy` supports only --schema/--config. It never
# generates the Prisma Client (that happens at image build: `prisma generate`),
# so there is no --skip-generate flag here — passing it is a hard CLI error.
bunx prisma migrate deploy

if [ -n "$ADMIN_PHONE" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "[overa] ensuring platform admin account…"
  bun run scripts/create-admin.ts || echo "[overa] WARNING: admin bootstrap failed — check ADMIN_PHONE/ADMIN_PASSWORD."
fi

if [ "$SEED_DEMO" = "1" ]; then
  echo "[overa] seeding DEMO content (SEED_DEMO=1)…"
  bun run scripts/seed.ts || echo "[overa] WARNING: demo seed failed — the app will start with real data only."
else
  echo "[overa] SEED_DEMO not set — skipping demo content (production-safe default)."
fi

echo "[overa] starting server…"
exec "$@"
