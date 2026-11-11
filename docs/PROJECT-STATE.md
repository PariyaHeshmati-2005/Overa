# Overa — Project state

**Last updated:** 2026-11-12 (Tehran time) — re-verified independently in a
second session on the same day (see the end of this file).

## Current phase

- **Phase:** Full-stack implementation with Docker + GitHub Actions CI/CD
  (the user's explicit request — covers the playbook's Phases 0–1 foundation,
  most of 2–7 product scope, 10 deployment packaging).
- **Status:** DONE (verified in this session).

## What is implemented and verified

| Area | State |
|---|---|
| All 29 source pages | Converted to production routes — every route returned HTTP 200 during verification (`/404`/`/500` serve their status designs) |
| Unified session/auth | Password + OTP (demo-labelled), session cookie, guest/auth header invariant verified in browser |
| Rental state machine | Server-enforced transitions + roles; invalid/forbidden actions return 422 with Persian messages (verified via API) |
| APIs | auth, listings, reservations, conversations, wallet, reviews, claims, notifications, admin — all live |
| Data | Prisma/SQLite schema + seed from the source page content (8 categories, 18 listings incl. draft/pending, 6 reservations across states, chats, reviews, claims, ledger) |
| Docker | Dockerfile (multi-stage, non-root, healthcheck), docker-compose (volume), entrypoint (db push + first-run seed) |
| CI/CD | `ci.yml` (lint/type/test/build/smoke), `docker-publish.yml` (GHCR + optional SSH deploy), `vercel.yml` (manual) |
| Tests | `bun test` — 12 passing (state machine, formatters, `parseIntSafe` regression) |
| Lint/TS | 0 lint errors project-wide; type-check via `tsc --noEmit` passes |

## Verification evidence (this session)

- `bun run lint` → 0 errors (after ignoring the vendored `overa-source/`).
- `bun test` → 10 pass / 0 fail.
- All 27 main routes → HTTP 200; bad item id → global 404 design.
- Browser (agent-browser): guest header «ورود | ثبت‌نام» ✓; renter login →
  header «سارا محمدی» ✓; `/rentals` real data ✓; `/rental-lifecycle/<id>`
  stepper + sandbox labels ✓; `/categories` tabs + hero + cards ✓.
- API: OTP request/verify round-trip created user ✓; `pay` on REQUESTED →
  422 ✓; renter `approve` → 422 ✓; renter `cancel` → 200 ✓ (then re-seeded).

## Known limitations / explicitly blocked

- OTP SMS delivery: demo mode until `SMS_PROVIDER_API_KEY` + provider path.
- Payments/escrow/payouts: sandbox adapter, labelled everywhere; no provider.
- Uploads: disabled with «به‌زودی» until object storage is connected.
- Chat realtime: 4s polling (Vercel-compatible) instead of WebSockets.
- `/404` and `/500` direct URLs return their HTTP status codes (by design);
  browsers render the full page designs.

## Exact commands used

```bash
bun install
bun run db:push
bun run seed            # scripts/seed.ts
bun run lint
bun test
bun run build           # verified passing
# browser checks via agent-browser against http://localhost:3000
```

## Next phase / next actions

1. Choose deployment path (Docker server vs Vercel) — see
   `docs/DEPLOYMENT.md` §1–3.
2. Push to GitHub; confirm the CI workflow is green.
3. If going to Vercel: provision a hosted database and set `DATABASE_URL`.
4. Later integrations: SMS provider, payment gateway sandbox, object storage
   (each documented in `docs/ARCHITECTURE.md` §10).

## Assumptions the next session must not silently change

- Visual identity is frozen (see `docs/UI-DESIGN-BASELINE.md`).
- The `m3-*` token renaming map in `AGENTS.md` must stay in sync.
- Money flows remain sandbox-labelled until a real provider confirms events.
- Guest state never renders demo identities.
- `bun` is the package manager/runtime (lockfile committed).

## Independent re-verification (second session, same day)

The prior session's claims were re-checked from scratch; one real defect was
found and fixed:

1. **Bug — `GET /api/listings` returned `[]`:** `parseIntSafe(null, 60)`
   evaluated `Number(null) === 0`, so `take: 0` was passed to Prisma. Fixed in
   `src/lib/format.ts` (null/blank → fallback) and covered by a regression
   test. API now returns all 16 ACTIVE listings.
2. Non-issues confirmed: `/item-details` and `/rental-lifecycle` without an id
   correctly 404 (dynamic `[id]` routes); `/404` and `/500` serve their HTTP
   status codes by design; the Docker healthcheck targets `/` (no
   `/api/health` is needed); `docker-publish.yml` YAML is valid (an apparent
   `[m` corruption was a terminal-rendering artifact, parser-confirmed OK).
3. Full browser pass re-run: guest/auth header invariant, password + OTP
   sign-in (OTP round-trip created a session for a new phone number), renter
   pages, host pages, lifecycle authorization (cross-tenant access blocked),
   mobile 390px — details in `docs/CHANGELOG.md` (re-verification entry).
4. `bun run build` re-run after the fix: production build passes.

Deliverable: the complete project is packaged as `download/overa-fullstack.zip`
(all source, Docker, CI/CD, docs — no secrets, no build output).
