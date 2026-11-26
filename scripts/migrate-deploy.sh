#!/bin/sh
# Overa — production-safe migration runner.
#
# Why this exists: on platforms that start the app without the Docker
# entrypoint (Zeabur/Vercel buildpacks, `bun run start`, `next start`, …)
# `prisma migrate deploy` was never run, so new code could hit
# P2022 "column X does not exist in the current database".
#
# This script is called from the `build` script, the `start` script and the
# Docker entrypoint, so whichever path boots the app, migrations are applied
# first. It is idempotent: `prisma migrate deploy` is a no-op when there are
# no pending migrations, and it NEVER destructively changes data (only
# additive, forward migrations from prisma/migrations are applied).
#
# Behaviour:
#   1. DATABASE_URL unset            -> warn and exit 0 (local build case).
#   2. migrate deploy succeeds       -> done.
#   3. deploy fails, but the base tables exist (an existing database that was
#      set up without migration history, e.g. via `prisma db push`) -> mark the
#      previous migrations as applied (baseline) and deploy only the new ones.
#   4. deploy fails and no base tables -> DATABASE_URL is wrong/unreachable:
#      abort with a clear error (the app cannot work without its database).
set -u

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[overa-migrate] DATABASE_URL is not set — skipping migrations."
  exit 0
fi

echo "[overa-migrate] applying database migrations (prisma migrate deploy)…"
if bunx prisma migrate deploy; then
  echo "[overa-migrate] migrations up to date."
  exit 0
fi

echo "[overa-migrate] migrate deploy failed — checking for an existing database without migration history…"
if bunx prisma db execute --url "$DATABASE_URL" --stdin <<'SQL' >/dev/null 2>&1
SELECT 1 FROM "Reservation" LIMIT 1;
SQL
then
  echo "[overa-migrate] base tables exist but _prisma_migrations history is missing — baselining previous migrations…"
  for m in 20261114195254_init 20261114195504_add_is_demo_flags 20261114195907_add_listing_search_key; do
    if bunx prisma migrate resolve --applied "$m" >/dev/null 2>&1; then
      echo "[overa-migrate] baselined: $m"
    else
      echo "[overa-migrate] baseline skipped (already recorded): $m"
    fi
  done
  echo "[overa-migrate] retrying migrate deploy for the remaining (new) migrations…"
  if bunx prisma migrate deploy; then
    echo "[overa-migrate] migrations up to date (after baseline)."
    exit 0
  fi
else
  echo "[overa-migrate] could not read the base tables either." >&2
fi

echo "[overa-migrate] ERROR: migrations could not be applied." >&2
echo "[overa-migrate] Check DATABASE_URL/DIRECT_URL (host reachable? sslmode=require for Neon?) and run 'bunx prisma migrate status'." >&2
exit 1
