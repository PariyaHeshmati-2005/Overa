# Overa — Architecture

## 1. Decision summary

The original project is 29 static HTML pages with three embedded React
mini-apps (categories, create-listing, rental-lifecycle) using vendored
UMD React/Tailwind. The target platforms are GitHub + Vercel, plus Docker for
self-hosting.

**Chosen stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 +
Prisma/SQLite.** Rationale against the alternatives:

| Option | Why chosen / not chosen |
|---|---|
| **Next.js App Router (chosen)** | One codebase for pages and APIs; server components read the DB directly (no accidental client-side data leaks); route handlers give real server-side authorization; preserves URLs naturally; standalone output ships a small Docker image; Vercel-native |
| Vite + React SPA | Needs a separate backend to enforce any authorization — more moving parts for the same result |
| Static migration | Cannot implement auth, state-machine validation, ledger, admin gating |

## 2. Rendering & data flow

- Pages are **server components** by default: they call Prisma via
  `src/lib/db.ts` and the session via `src/lib/auth.ts#getCurrentUser()`.
- Interactivity (filters, wizard, chat, lifecycle actions) lives in client
  components that talk to REST endpoints under `src/app/api/*`.
- Route groups: `(main)` wraps site pages with a full-height flex shell;
  auth/system pages compose their own headers exactly like the source.

## 3. Session & authorization

- Sessions: random 32-byte token in an httpOnly cookie (`overa_session`),
  stored in the `Session` table, 30-day TTL, server-side expiry check.
- Passwords: scrypt with per-user salt (`src/lib/auth.ts`), constant-time
  comparison. No external auth dependency.
- OTP: 4-digit code, 2-minute expiry, max 3 requests / 10 min / phone.
  Without `SMS_PROVIDER_API_KEY` the API returns `devCode` and the UI labels
  it «حالت توسعه» — honest demo mode, never presented as production auth.
- **Authorization is enforced server-side in every API handler**
  (`requireUser` / `requireAdmin` + ownership checks). Client-side hiding of
  controls is only cosmetic.
- Guest-state invariant: no route renders a signed-in-looking identity to a
  guest. The old hard-coded names (سارا محمدی / علی رضایی in item-details,
  rentals, host-dashboard headers) are replaced by the shared `UserMenu`
  which renders only the real session user.

## 4. Rental state machine

`src/lib/rental-state.ts` is the single source of truth:

- canonical statuses with Persian labels/colors,
- transition table + `assertTransition` (throws `TransitionError`),
- actor matrix (`canAct(status, action, renter|host|admin)`).

The reservation PATCH endpoint is the only writer of reservation status; it
validates transition + actor, appends a `ReservationEvent` (audit trail) and,
for money-touching actions, writes `WalletTransaction` rows and balance
deltas inside one Prisma transaction — all labelled sandbox.

## 5. Finance truthfulness

`WalletTransaction` + `User.walletBalance` are an **application ledger**.
Nothing claims bank custody, real escrow, or provider-confirmed movement.
The seed, the wallet UI and the lifecycle UI all carry «شبیه‌سازی» labels.
A real provider (e.g. Zarinpal) plugs into the `pay`/payout paths later; the
playbook's rule (never claim real money without provider confirmation) is
encoded in UI copy, not just documentation.

## 6. Chat

Reservation/listing-scoped conversations with participant checks. Transport is
**4-second polling** of `/api/conversations/[id]/messages` — deliberately not
WebSockets, because the deployment targets include Vercel functions where
long-lived connections are not supported. Attachment uploads are disabled
(«به‌زودی») until object storage is connected.

## 7. Design system preservation

- `src/app/globals.css` carries BOTH token families from the source pages:
  the violet family (`primary` #4C2A9E, accents, neutrals, card shadows,
  `custom-gradient-banner`, `glass-card`, badge gradients) and the
  Material-3 family used by the dashboards/auth pages (surface containers,
  on-surface, primary-container, `ov-bg` blobs). Colliding names are prefixed
  `m3-*` (mapping table in `AGENTS.md`).
- Fonts are the original local files (`public/assets/fonts/fonts.css` →
  Vazirmatn + Plus Jakarta Sans + Material Symbols), no CDN.
- All imagery is the original 135 asset files under
  `public/assets/img/`, including the transparent logo.

## 8. Deployment shapes

- **Local/dev**: `bun run dev` on :3000, SQLite at `db/custom.db`.
- **Docker**: multi-stage build (`Dockerfile`), non-root runtime, volume
  `/app/db`, entrypoint pushes schema + seeds on first boot, healthcheck on
  `/`.
- **Vercel**: standalone output is compatible; a hosted database is required
  for Production (serverless filesystem is ephemeral) — documented in
  `docs/DEPLOYMENT.md`.

## 9. Testing strategy

- `tests/rental-state.test.ts` (bun test): happy path, invalid jumps,
  role permissions, status labels, reference-code format, Persian
  formatting helpers.
- CI runs lint → `tsc --noEmit` → tests → build → server smoke test.
- Browser E2E was executed during development (login, rentals, lifecycle,
  guest/auth header states, OTP round-trip).

## 10. Deferred integrations (explicit blockers, not fabrications)

| Integration | Status | What remains |
|---|---|---|
| SMS/OTP provider | demo mode, labelled | pick provider, set `SMS_PROVIDER_API_KEY`, implement send path in `/api/auth/otp/request` |
| Payment gateway | sandbox adapter | choose provider, merchant account, signed webhooks, idempotency |
| Object storage | disabled buttons | pick provider, upload API, attachment validation |
| Realtime chat upgrade | polling | managed realtime service if/when needed |
| KYC/document handling | status field + admin queue | provider integration, secure document storage |
