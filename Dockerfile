# syntax=docker/dockerfile:1

# =============================================================================
# Overa — production image (Next.js 16 + Prisma/SQLite)
# Multi-stage: deps -> build -> runtime. Bun is the package manager/runtime for
# install & build; the server runs under bun in the final stage.
# =============================================================================

FROM oven/bun:1 AS deps
WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM deps AS build
WORKDIR /app

COPY . .
# Generate the Prisma client, then build the standalone Next.js output.
# DATABASE_URL here is only used for build-time type generation.
ENV DATABASE_URL=file:/app/db/custom.db
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p db && bun run db:push && bun run build

# NOTE: demo content is deliberately NOT seeded during the image build.
# docker-compose mounts the overa_db volume over /app/db, shadowing anything
# baked into the image, so build-time seeding is wasted work — and a fragile
# build dependency (the SQLite query engine can stall under builder load and
# fail with P1008 "Socket timeout"). The entrypoint pushes the schema and
# seeds the volume on the container's first start instead (with retries).

FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
# NOTE: oven/bun:1-slim is now Debian trixie based and no longer ships the
# adduser/addgroup commands. Install the "adduser" package first, then create
# the group (gid 1001) and attach the user to it with --ingroup.
RUN apt-get update \
    && apt-get install -y --no-install-recommends adduser \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 overa \
    && adduser --system --uid 1001 --ingroup overa overa

COPY --from=build --chown=overa:overa /app /app

USER overa
EXPOSE 3000

COPY --chown=overa:overa docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
