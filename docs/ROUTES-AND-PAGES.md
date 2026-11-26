# Overa — Route map (old → new)

Every original source page and its production route. Originals live in
`overa-source/overa-marketplace/` (git-ignored reference copy).

| # | Original source | Production route | Access | Implementation notes | Status |
|---|---|---|---|---|---|
| 1 | index.html | `/` | public | shared session-aware header, hero, filters, grid (real listings), trust strip, app banner | done |
| 2 | categories.html | `/categories` | public | React mini-app → tabbed client app (`?tab=`), search/sort/filters over real data | done |
| 3 | item-details.html | `/item-details/[id]` | public (owner-only for non-active) | gallery, specs, reviews, booking box, chat CTA | done |
| 4 | how-it-works.html | `/how-it-works` | public | static conversion, working toggles | done |
| 5 | about.html | `/about` | public | static conversion (team roster is source content) | done |
| 6 | discounts.html | `/discounts` | public | coupon center, copy-to-clipboard, labelled demo coupons | done |
| 7 | tos-support-faq.html | `/tos-support-faq` | public | searchable FAQ accordion, legal text preserved | done |
| 8 | signin.html | `/signin` | public | password login, demo-accounts hint box | done |
| 9 | signin-otp.html | `/signin-otp` | public | OTP request/verify, `?next=` return route, dev-mode code display | done |
| 10 | signup.html | `/signup` | public | registration → auto session | done |
| 11 | account-settings.html | `/account-settings` | authenticated | profile edit (PATCH `/api/auth/profile`), notifications, KYC status card | done |
| 12 | rentals.html | `/rentals` | authenticated | real reservations (renter+host), status tabs, sandbox wallet strip | done |
| 13 | rental-lifecycle.html | `/rental-lifecycle/[id]` | participants | 4-stage stepper + event timeline + state-machine actions; `?code=OVR-XXXXX` deep-link | done |
| 14 | submit-review.html | `/submit-review` | participants | `?reservation=<id>`, POST `/api/reviews` (COMPLETED-only, one per side) | done |
| 15 | live-chat.html | `/live-chat` | authenticated | conversation list + 4s polling, `?c=<id>` deep-link | done |
| 16 | wallet.html | `/wallet` | authenticated | real balance/ledger, payout/topup (sandbox-labelled) | done |
| 19 | host-dashboard.html | `/host-dashboard` | host | real aggregates, moderation-aware pending queue, approve/reject/deliver actions | done |
| 20 | my-items.html | `/my-items` | host | listing table, status tabs, pause/resume/submit/archive via PATCH | done |
| 21 | create-listing.html | `/create-listing` | authenticated | 4-step wizard + preview, `?edit=<id>`, draft/submit | done |
| 22 | reviews.html | `/reviews` | host | reviews on own listings + host reply (PATCH `/api/reviews/[id]/reply`) | done |
| 23 | damage-claims.html | `/damage-claims` | authenticated | claim list + new claim (moves reservation to DISPUTED) | done |
| 24 | arbitration-panel.html | `/arbitration-panel` | admin | case review/decision/appeal flows (audited) | done |
| 25 | admin-dashboard.html | `/admin-dashboard` | admin | stats from real data, listing moderation, KYC queue, audit log | done |
| 26 | 404.html | `src/app/not-found.tsx` + `/404` | public | global 404 design | done |
| 27 | 500.html | `src/app/error.tsx` + `/500` | public | global error boundary with retry | done |
| 28 | loading.html | `/loading` + `(main)/loading.tsx` | public | route + Next.js loading UI | done |
| 29 | pages.html | `/pages` | public | sitemap index, links rewritten | done |
| — | mobile/*.html (5 pages) | — | — | used as responsive references; no duplicate mobile routes | folded into responsive behavior |

## Hash-route compatibility

| Old hash route | New behavior |
|---|---|
| categories.html#/camping · #/cinemas · #/gaming · #/tools … | `/categories?tab=camping|cameras|gaming|tools…` |
| rental-lifecycle.html#step-* | `/rental-lifecycle/[id]` renders the current DB stage; events timeline replaces fake steps |
| create-listing.html#step-* | `/create-listing` internal wizard state (client), `?edit=` for resuming drafts |

## REST API surface

| Endpoint | Methods | Auth |
|---|---|---|
| `/api/auth/register` · `/login` · `/logout` · `/me` | POST/GET | public/session |
| `/api/auth/otp/request` · `/verify` | POST | public (rate-limited) |
| `/api/auth/profile` | PATCH | session |
| `/api/listings` · `/api/listings/[id]` | GET/POST/PATCH/DELETE | public read; owner/admin write |
| `/api/reservations` · `/api/reservations/[id]` | GET/POST/PATCH | session; participant actions via state machine |
| `/api/conversations` · `/api/conversations/[id]/messages` | GET/POST | participants only |
| `/api/wallet` | GET/POST | session (sandbox ledger) |
| `/api/reviews` · `/api/reviews/[id]/reply` | POST/PATCH | participants; host reply |
| `/api/claims` | GET/POST | participants |
| `/api/notifications` | GET/POST | session |
| `/api/admin/stats` · `/api/admin/listings/[id]` · `/api/admin/claims/[id]` · `/api/admin/users/[id]` | GET/PATCH | admin only, audited |
