# Overa — Deployment guide

Three supported deployment shapes: **Docker (self-host)**, **Vercel**, and
plain **GitHub Actions verification**. Secrets never live in the repository —
only `.env.example` names are committed.

---

## 1. GitHub setup

```bash
cd overa-marketplace-next        # this repository
git init                         # if not already a repository
git add .
git commit -m "Overa: full-stack Next.js implementation with Docker + CI/CD"
git branch -M main
git remote add origin git@github.com:<OWNER>/<REPO>.git   # owner supplies the URL
git push -u origin main
```

Before pushing, verify:

- [ ] `bun run build` succeeds locally
- [ ] `.gitignore` excludes `.env*`, `db/*.db`, `overa-source/`, build output
- [ ] No secrets in history (`grep -r "sk_\|api_key" --include="*.ts" src/` is clean)

CI runs automatically on push: lint → type-check → unit tests → production
build → server smoke test → Prisma schema validation.

## 2. Docker (self-host)

```bash
docker compose up -d --build
# app on http://localhost:3000, data in the overa_db volume
```

Schema push and the demo seed run on the app container's **first start** (the
entrypoint writes a `.seeded` marker into the volume once it succeeds). Seeding
is retried automatically within the start; if it still fails, the app starts
with an empty database and `docker compose restart app` retries the seed.

Server deployment via CI: add repository variable
`ENABLE_SERVER_DEPLOY=true` and secrets `SSH_HOST`, `SSH_USER`,
`SSH_PRIVATE_KEY`; the `docker-publish.yml` workflow then pulls the fresh
GHCR image and restarts the compose service on the main branch.

```bash
# on the server (/opt/overa with the same docker-compose.yml)
docker compose pull && docker compose up -d
```

## 3. Vercel

### Option A — dashboard import (recommended)

1. Push the repository to GitHub.
2. Vercel → **Add New Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected). Root directory: `/`.
   Build command: `next build` (default). No overrides needed.
4. Environment variables (Project → Settings → Environment Variables):

| Variable | Environments | Value guidance |
|---|---|---|
| `DATABASE_URL` | Development, Preview, Production | **Hosted database URL** — Vercel's serverless filesystem is ephemeral, so a container/managed Postgres (or a hosted SQLite-compatible service) is required for anything beyond preview demos |
| `SMS_PROVIDER_API_KEY` | Production only (optional) | unset keeps OTP in labelled demo mode |

5. Deploy → test the **Preview** URL before promoting to Production:
   - direct refresh on nested routes (`/item-details/<id>`, `/rentals`)
   - guest header vs signed-in header
   - mobile 390px layout, fonts, images (all local — no CDN dependencies)
   - 404 page for bad routes

### Option B — CI-driven (optional workflow)

`.github/workflows/vercel.yml` exists for CI-driven deploys. It only runs
manually (`workflow_dispatch`) and needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
`VERCEL_PROJECT_ID` repository secrets.

### Vercel + SQLite caveat

The repo's default SQLite works locally and in Docker. On Vercel, either use
a hosted DB provider and swap the Prisma datasource, or keep Vercel for the
frontend and route API calls to a Docker-hosted backend. Do **not** rely on
writes to the serverless filesystem surviving requests.

## 4. Post-deployment verification checklist

- [ ] `/` renders hero, filters, real listings
- [ ] Guest sees «ورود | ثبت‌نام» on every page; signed-in users see their
      real name; sign-out reverts instantly
- [ ] Login (password + OTP demo) works; protected routes redirect with
      `?next=` return flow
- [ ] Rent flow end-to-end: item → request → approve (host) → agreement →
      sandbox payment → deliver → return → inspection → complete
- [ ] Invalid transitions blocked (HTTP 422 with Persian messages)
- [ ] Wallet shows balance + sandbox-labelled ledger
- [ ] Admin console accessible only with the admin account
- [ ] Mobile 390px: no horizontal overflow; sticky footer intact
- [ ] 404 page for unknown routes; error boundary on server failure

## 5. Going live with real integrations (future)

1. Choose/configure an SMS provider → implement the send path in
   `src/app/api/auth/otp/request/route.ts` (remove the `devCode` response).
2. Choose a payment provider → replace the sandbox branch in the reservation
   `pay` action; add signed webhooks with idempotency; keep the visible
   sandbox/labelling until the provider confirms real transactions.
3. Connect object storage for uploads (attachments, listing images).
4. KYC/documents: provider integration + secure storage + admin workflow.

None of these are simulated as "live" anywhere in the current code.
