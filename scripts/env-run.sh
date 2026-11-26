#!/usr/bin/env bash
# Loads .env.local (if present) and exports it before running the given command.
# Why: some environments inject a global DATABASE_URL into the process
# environment, which takes precedence over .env files in both Prisma and
# Next.js. This wrapper guarantees that a project-local .env.local (gitignored,
# machine-specific) wins in the local development sandbox. In production
# (Vercel) .env.local does not exist, so the dashboard-provided variables are
# used unchanged — the wrapper is a no-op there.
set -euo pipefail
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi
exec "$@"
