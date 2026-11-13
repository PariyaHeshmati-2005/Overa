#!/bin/sh
set -e

# Overa container entrypoint
# 1. Ensure a writable database location (mounted volume wins).
# 2. Push the Prisma schema (idempotent).
# 3. Seed demo content only when the database is empty (retried, marker is
#    written on success only — a failed seed is retried on the next start).
# 4. Start the Next.js server.

DATA_DIR="/app/db"
DB_FILE="$DATA_DIR/custom.db"

mkdir -p "$DATA_DIR"

echo "[overa] applying database schema…"
bunx prisma db push --accept-data-loss --skip-generate

SEED_MARKER="$DATA_DIR/.seeded"
if [ -f "$SEED_MARKER" ]; then
  echo "[overa] database already seeded — skipping."
else
  echo "[overa] seeding demo content…"
  max_attempts=3
  attempt=1
  seeded=0
  while [ "$attempt" -le "$max_attempts" ]; do
    if bun run scripts/seed.ts; then
      seeded=1
      break
    fi
    echo "[overa] seed attempt ${attempt}/${max_attempts} failed."
    if [ "$attempt" -lt "$max_attempts" ]; then
      sleep 5
    fi
    attempt=$((attempt + 1))
  done
  if [ "$seeded" -eq 1 ]; then
    touch "$SEED_MARKER"
    echo "[overa] demo content seeded."
  else
    echo "[overa] WARNING: seed failed after ${max_attempts} attempts — starting with an empty database."
    echo "[overa] Restart the container to retry: docker compose restart app"
  fi
fi

echo "[overa] starting server on port ${PORT:-3000}…"
exec "$@"
