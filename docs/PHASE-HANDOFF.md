# Overa — Phase handoff (portable)

## Project identity

Overa (اورا) is a Persian-first peer-to-peer rental marketplace. The original
artifact was 29 static HTML pages + 5 mobile references + 3 embedded React
mini-apps. This session converted it into a full-stack Next.js 16 application
with Docker packaging and GitHub Actions CI/CD, preserving the established
visual identity.

## Current state

- Last completed work: full conversion (all pages/routes), backend APIs,
  auth/session unification, rental state machine, seed data, Docker, CI/CD,
  docs, tests — all verified in-session.
- Architecture: Next.js 16 App Router · TypeScript · Tailwind 4 with the
  source's dual token system · Prisma/SQLite · scrypt+cookie sessions ·
  sandbox-labelled finance adapter · polling chat.
- Latest commit: 01db373 (local main; the user pushes to their GitHub — see
  `docs/DEPLOYMENT.md` §1).

## Read these files first (next agent)

1. `AGENTS.md` — conversion conventions + token mapping (authoritative).
2. `docs/PROJECT-STATE.md` — exact status and evidence.
3. `docs/ARCHITECTURE.md` — decisions and deferred integrations.
4. `docs/ROUTES-AND-PAGES.md` — route/API map.
5. `docs/UI-DESIGN-BASELINE.md` — frozen visual tokens.
6. `prisma/schema.prisma` + `scripts/seed.ts` — domain model + demo data.
7. `src/lib/rental-state.ts` — the state machine contract.

## Critical decisions — do not silently change

- Preserve the source visual identity; `m3-*` token prefix map is required.
- Guest state shows «ورود | ثبت‌نام»; authenticated state shows the real user
  via `UserMenu`. Never render hard-coded identities.
- All money wording is sandbox-labelled until a real provider confirms.
- Authorization is server-side in every API handler.
- Chat uses polling (deployment-portable), not WebSockets.
- Bun is the package manager (frozen lockfile in CI).

## Exact next task

1. Push this repository to GitHub (`docs/DEPLOYMENT.md` §1) and confirm the
   CI workflow passes.
2. Pick the deployment path: Docker server (§2) or Vercel (§3 — needs a
   hosted `DATABASE_URL`).
3. Complete the post-deployment checklist (§4).
4. When ready for production integrations: SMS provider → payment sandbox →
   object storage (each with the remaining steps in `docs/ARCHITECTURE.md`
   §10).

## Files the user should upload to a new AI session

- The full repository (or the delivered ZIP) — it is self-contained.
- `docs/PROJECT-STATE.md` + this handoff + `AGENTS.md` if the platform
  accepts only text.

## Do not upload / do not commit

- `.env` (real values), `db/*.db` (local data), `node_modules`, `.next`,
  `overa-source/` (vendored prototype), `dev.log`/`server.log`.

## Latest verification

- `bun run lint` → 0 errors; `bun test` → 12/12; all routes HTTP 200;
  browser-verified golden paths (login, OTP round-trip, rentals, lifecycle,
  categories, guest/auth header states); API-verified state machine
  rejections; cross-tenant lifecycle access blocked; mobile 390px OK.
- Production build (`bun run build`) verified passing (re-run after the
  `parseIntSafe` fix).
- Fixed during re-verification: `parseIntSafe` zeroed `take` on
  `/api/listings` (Number(null) === 0) — empty catalog bug; regression test
  added. Screenshots in `docs/screenshots/`.

## Copy-paste continuation prompt

```
You are continuing the Overa (اورا) project — a Persian-first rental
marketplace built as a Next.js 16 full-stack app (see AGENTS.md and
docs/PROJECT-STATE.md first). Preserve the established visual identity and
RTL Persian experience; never show demo identities to guests; keep all
finance copy sandbox-labelled until a real provider is configured. The
current status, next tasks and constraints are recorded in
docs/PROJECT-STATE.md and docs/PHASE-HANDOFF.md. Deliver complete files, run
lint/tests/build before reporting, and update docs/PROJECT-STATE.md,
docs/CHANGELOG.md and this handoff afterwards.
```
