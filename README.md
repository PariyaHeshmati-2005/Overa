# اورا (Overa) — Persian-first rental marketplace

Full-stack implementation of the **Overa** marketplace: a peer-to-peer rental
platform for equipment and belongings. This repository converts the original
29-page static HTML prototype into a **Next.js 16 full-stack application**
while preserving the established visual identity (Persian RTL, Vazirmatn,
violet/gold/emerald palette, Overa logo and imagery).

| | |
|---|---|
| **Frontend + backend** | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| **Styling** | Tailwind CSS 4 with the original Overa design tokens |
| **Database** | SQLite via Prisma ORM (seeded demo catalog) |
| **Auth** | Session cookies + scrypt password hashing + OTP (demo mode until an SMS provider is configured) |
| **Payments/escrow** | SANDBOX adapter only — explicitly labelled, no real money |
| **Docker** | Multi-stage image + docker-compose with a data volume |
| **CI/CD** | GitHub Actions: lint → type-check → tests → build → smoke test; Docker image → GHCR; optional Vercel deploy workflow |

---

## Quick start (local)

```bash
bun install            # install dependencies (bun.lock is committed)
cp .env.example .env   # defaults work out of the box
bun run db:push        # create the SQLite schema
bun run seed           # fill the demo catalog (users, listings, reservations)
bun run dev            # http://localhost:3000
```

Quality gates:

```bash
bun run lint           # ESLint
bunx tsc --noEmit      # TypeScript
bun test               # unit tests (state machine, formatters)
bun run build          # production build (standalone output)
bun run start          # serve the production build
```

### Demo accounts (password for all: `overa1234`)

| Role | Phone | Visible in |
|---|---|---|
| Renter (مستأجر) | `09121111111` | rentals, chat, wallet, claims |
| Host (میزبان) | `09122222222` | host dashboard, my items, reviews |
| Admin (مدیر) | `09120000000` | admin dashboard, arbitration panel |

OTP sign-in runs in **demo mode** when no SMS provider key is configured: the
code is shown on screen with a «حالت توسعه» label. It is never hidden, and it
is never claimed to be production authentication.

---

## Docker

```bash
docker compose up -d --build   # build + start (http://localhost:3000)
docker compose logs -f app     # follow logs
docker compose down            # stop (data persists in the overa_db volume)
```

- The entrypoint applies the Prisma schema, seeds demo data on first run and
  starts the server (non-root user, healthcheck included).
- Data persists in the `overa_db` volume (`/app/db/custom.db`).
- Set `SMS_PROVIDER_API_KEY` in `docker-compose.yml` only when a real provider
  is configured.

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/ci.yml` | push / PR to main | install (frozen lockfile) → Prisma validate → lint → type-check → `bun test` → production build → smoke-test the server |
| `.github/workflows/docker-publish.yml` | push to main / tags `v*` | build multi-stage image → publish to GHCR (`ghcr.io/<owner>/<repo>`) → optional SSH server deploy (enable with `ENABLE_SERVER_DEPLOY=true` + SSH secrets) |
| `.github/workflows/vercel.yml` | manual (`workflow_dispatch`) | CI-driven Vercel deploy; requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. For dashboard-imported projects, Vercel deploys automatically without this file |

---

## What is implemented

- **All 29 original pages** are now production routes (see
  `docs/ROUTES-AND-PAGES.md`), including the three embedded React mini-apps
  (categories tabs, create-listing wizard, rental lifecycle) rebuilt as real
  React state with the same composition.
- **Unified session-aware navigation** — every header shows
  «ورود \| ثبت‌نام» for guests and the real account menu for signed-in users.
  Hard-coded demo identities are gone (the only remaining occurrences are the
  About-page team roster and a signup placeholder, both legitimate content).
- **Rental state machine** (`src/lib/rental-state.ts`): REQUESTED → APPROVED →
  AGREEMENT → PAYMENT → PAID → DELIVERED → RETURNED → INSPECTION → COMPLETED
  (+ REJECTED / CANCELLED / DISPUTED). All transitions are validated
  server-side with role permissions (unit-tested); invalid jumps return 422.
- **Backend APIs** for auth (password + OTP), listings CRUD + search/filters,
  reservations, chat (polling), wallet ledger, reviews, damage claims, admin
  moderation/audit — every endpoint re-checks identity, role and ownership.
- **Truthful finance**: deposits, payouts and payment stages are labelled
  «شبیه‌سازی (Sandbox)» everywhere; the ledger is an application ledger, not
  real custody.
- **Responsive RTL** at 390 / 768 / desktop widths; the five mobile reference
  pages were folded into responsive behavior rather than duplicate routes.

## Repository layout

```text
prisma/schema.prisma        domain model (users…audit log)
scripts/seed.ts             demo seed from the original page content
src/app/(main)/             all site routes (server components + client islands)
src/app/api/                REST endpoints (auth, listings, reservations, …)
src/components/layout/      session-aware header/footer/user menu
src/components/overa/       shared Overa UI (listing card, 404/500 content)
src/lib/                    auth, db, rental-state, format, api helpers
docs/                       architecture, routes, deployment, state & handoff
tests/                      bun unit tests
Dockerfile · docker-compose.yml · docker-entrypoint.sh
.github/workflows/          CI + Docker CD + optional Vercel deploy
overa-source/               the original HTML prototype (reference only, git-ignored)
```

## Environment

`.env.example` documents every variable. `DATABASE_URL` is the only required
one. Real `.env*` files are git-ignored; never commit secrets.

## Known limitations

- OTP has no real SMS delivery until a provider key is configured (clearly
  labelled demo mode).
- Payment/deposit flows are sandbox simulations by design — no provider is
  configured and no real money movement is claimed anywhere.
- File/attachment uploads are intentionally disabled (buttons show «به‌زودی»)
  until durable object storage is connected.
- Chat uses 4-second polling (Vercel-compatible) rather than long-lived
  WebSockets.

See `docs/PROJECT-STATE.md` for the precise status and
`docs/PHASE-HANDOFF.md` if you are continuing this project in a new session.

---

## نصب به‌عنوان اپلیکیشن (PWA)

اورا یک Progressive Web App است و بدون استور، مثل یک اپ واقعی روی گوشی و دسکتاپ نصب می‌شود:

- **اندروید (Chrome/Edge):** منوی سه‌نقطه ← «Add to Home Screen / Install app»
- **iOS (Safari):** دکمه Share ← «Add to Home Screen»
- **دسکتاپ (Chrome/Edge):** آیکون نصب در نوار آدرس ← Install

نسخه نصب‌شده آیکون اختصاصی، اجرای تمام‌صفحه و کش آفلاین برای فایل‌های استاتیک دارد.
جزئیات فنی و راهنمای کامل: `docs/PWA.md`
