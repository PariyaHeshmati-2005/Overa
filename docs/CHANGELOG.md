# Overa — Changelog

## 2026-11-12 — Full-stack conversion + Docker + CI/CD (initial implementation)

### Added
- Next.js 16 (App Router, TypeScript) application replacing the 29-page
  static prototype; all pages converted 1:1 to production routes with the
  original imagery/fonts/copy (see `docs/ROUTES-AND-PAGES.md`).
- Prisma domain model + SQLite database with a seed script built from the
  real content of the source pages (categories, 18 listings, 6 reservations
  across lifecycle states, conversations, reviews, claims, ledger).
- Session authentication: password (scrypt) + OTP with visible demo mode,
  30-day httpOnly sessions, server-side authorization on every API.
- Rental state machine (`src/lib/rental-state.ts`) with server-enforced
  transitions, role matrix, audit events and Persian labels.
- REST APIs: auth, profile, listings, reservations, conversations/messages,
  wallet (sandbox ledger), reviews + host replies, claims, notifications,
  admin (stats, listing moderation, claim decisions, user KYC) — all with
  audit logging for sensitive actions.
- Session-aware header system: shared `SiteHeader` for the index-family
  pages, page-faithful headers with `UserMenu` elsewhere; hard-coded demo
  identities removed from guest views.
- Docker packaging: multi-stage `Dockerfile` (non-root, healthcheck),
  `docker-compose.yml` with data volume, `docker-entrypoint.sh`
  (schema push + first-run seed).
- GitHub Actions: `ci.yml` (install/lint/type-check/tests/build/smoke),
  `docker-publish.yml` (GHCR publish + optional SSH deploy),
  `vercel.yml` (manual CI-driven deploy).
- Unit tests (`bun test`): state-machine transitions/roles, Persian
  formatting helpers.
- Docs: `README.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`,
  `docs/ROUTES-AND-PAGES.md`, `docs/UI-DESIGN-BASELINE.md`,
  `docs/PROJECT-STATE.md`, `docs/PHASE-HANDOFF.md`, this file, `AGENTS.md`.

### Changed
- `package.json`: project name/description, `test` and `seed` scripts.
- `eslint.config.mjs`: ignore vendored reference sources.
- `.gitignore`: exclude local databases, `overa-source/`, test artifacts.

### Preserved (visual)
- Exact source tokens (violet + M3 families), Vazirmatn/Plus Jakarta Sans,
  Material Symbols, Overa logo, all 135 original images, page compositions,
  Persian copy. Localized justified changes are listed in
  `docs/UI-DESIGN-BASELINE.md` §5 (session-aware auth control, sandbox
  labelling, disabled-until-backend controls).

### Known limitations
- OTP without real SMS provider (labelled demo), payments sandbox-only,
  uploads disabled, polling chat — each with its integration path documented.

## 2026-11-12 — Independent re-verification session (same day)

### Fixed
- **`parseIntSafe` returned 0 for missing query params** (`Number(null) === 0`
  in JavaScript), which zeroed `take` on `GET /api/listings` and made the
  public listings API return an empty array despite 16 seeded ACTIVE listings.
  The helper now treats null/blank as the fallback, moved to the
  dependency-free `src/lib/format.ts` (re-exported from `src/lib/api.ts`),
  with a regression test.

### Added
- `CLAUDE.md` entry point pointing to `AGENTS.md` (playbook requirement).
- `docs/screenshots/` with fresh browser captures (guest home, item details,
  rentals, wallet, host dashboard, mobile item details).
- `.gitignore` additions for local working artifacts (`upload/`, `download/`,
  `tool-results/`, sandbox-only files).

### Re-verified (independent, this session)
- `bun run lint` → 0 errors; `bun test` → 12/12 pass; `bunx tsc --noEmit` → pass.
- `bun run build` → production build passes; all routes present.
- All 25 static routes + dynamic `/item-details/[id]`, `/rental-lifecycle/[id]`
  probed over HTTP: correct 200s (`/404`→404, `/500`→500 by design).
- Browser (agent-browser) golden paths: guest header invariant (no demo
  identities), password sign-in (renter + host), OTP round-trip with visible
  demo code, account menu + real names, rentals/wallet/chat real data,
  host dashboard real stats, create-listing wizard, my-items, rental
  lifecycle stepper, cross-tenant access blocked («دسترسی به این اجاره مجاز
  نیست»), mobile 390px without horizontal overflow.
- GitHub Actions YAML for all three workflows validated with a parser.
