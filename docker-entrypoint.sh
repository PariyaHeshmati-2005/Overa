#!/bin/sh
set -e

# Overa container entrypoint
# 1. Ensure a writable database location (mounted volume wins).
# 2. Push the Prisma schema (idempotent).
# 3. Seed demo content only when the database is empty.
# 4. Start the Next.js server.

DATA_DIR="/app/db"
DB_FILE="$DATA_DIR/custom.db"

mkdir -p "$DATA_DIR"

echo "[overa] applying database schema…"
bunx prisma db push --accept-data-loss --skip-generate

echo "[overa] checking seed state…"
SEED_MARKER="$DATA_DIR/.seeded"
if [ ! -f "$SEED_MARKER" ]; then
  echo "[overa] seeding demo content…"
  bun run scripts/seed.ts || echo "[overa] WARNING: seed failed — starting with empty database."
  touch "$SEED_MARKER"
else
  echo "[overa] database already seeded — skipping."
fi

echo "[overa] starting server on port ${PORT:-3000}…"
exec "$@"
