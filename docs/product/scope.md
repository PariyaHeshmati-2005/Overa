# Scope — Frontend-only phase

## In scope
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS frontend.
- All pages from `docs/stitch/` ported as clean components.
- Typed mock data in `data/`.
- Mock session, stores (favorites, listing draft, rentals, messages).
- Form validation with react-hook-form + zod (Persian errors).
- Responsive layouts (desktop/tablet/mobile).
- RTL everywhere, Persian digits, Vazirmatn.

## Out of scope (later phase)
- Backend API, database, auth service.
- Supabase, Docker, deployment.
- Real payments, real file uploads, real messaging backend.
- Email/SMS OTP delivery (mocked).

## Constraints
- Runs locally with `npm install && npm run dev`.
- No external services required to run.
- All data is mock; mutations persist in client state only (and
  optionally localStorage for demo continuity).

## Success criteria
Every route in `docs/product/pages.md` loads, every button navigates or
performs a visible mock action, no dead links, lint + build clean.
