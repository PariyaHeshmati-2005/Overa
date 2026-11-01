# PLAN — Stitch audit & build order

## Audit table

| Stitch file | Page | Route | Section | Known defects |
|-------------|------|-------|---------|---------------|
| home.html | Home | `/` | Public | Latin digits; some English leftovers |
| Home – Mobile Design (390px) | Home (mobile) | `/` | Public | mobile reference |
| Categories.html | Browse | `/listings` | Browse | Latin digits; English leftovers |
| Categories & Item Discovery (mobile) | Categories hub | `/categories` | Browse | mobile reference |
| ItemDetails.html | Item details | `/listings/[id]` | Browse | Latin digits; English leftovers |
| Item Details & Booking (mobile) | Item details (mobile) | `/listings/[id]` | Browse | mobile reference |
| CreateListing.htm | New listing wizard | `/listings/new/step-1..4` | Owner | Large multi-section; split into 4 steps |
| MyItems & ManageDrafts.html | My items | `/my-items` | Owner | Latin digits |
| HostDashboard.html | Host dashboard | `/dashboard` | Owner | Brand "RentMo"; Latin digits |
| RentalsPage.html | My rentals | `/rentals` | User | Latin digits |
| RentalLifecycleManagement.html | Rental detail | `/rentals/[id]` | User | Latin digits; long page |
| (derived) | Checkout | `/checkout` | User | No stitch source; derive from lifecycle |
| Wallet & Deposits.html | Wallet | `/wallet` | User | Latin digits |
| LiveChat.html | Messages | `/messages` | User | Latin digits |
| Conversations & Live Chat (mobile) | Messages (mobile) | `/messages` | User | mobile reference |
| My Rentals & Profile (mobile) | Profile | `/profile` | User | mobile reference |
| AccountSettings.html | Settings | `/settings` | User | Latin digits |
| ReviewsAndFeedback.html | Reviews | `/reviews` | User | Latin digits |
| DamageClaimsAndDisputeResolution.html | Damage claim | `/damage-claims` | User | Latin digits |
| DamageAndDepositArbitrationPanel.html | Dispute arbitration | `/admin/disputes` | Admin | Latin digits |
| PlatformAdminDashboard.html | Admin dashboard | `/admin` | Admin | Latin digits |
| HowItWorks.html | How it works | `/how-it-works` | Public | Latin digits |
| AboutUs.html | About | `/about` | Public | Latin digits |
| Tos & Support & FAQ.html | Support | `/support` | Public | Latin digits |
| (derived) | Contact | `/contact` | Public | derived |
| (derived) | Favorites | `/favorites` | User | derived |
| SignIn.html | Login | `/login` | Auth | Latin digits |
| SignInWithOTP.html | Login (OTP) | `/login` | Auth | Latin digits |
| SignUp.html | Register | `/register` | Auth | Latin digits |
| (derived) | Reset password | `/reset-password` | Auth | derived |
| NotFoundPage.html | Not found | `not-found.tsx` | System | Latin digits |
| 500_Internal_Server_Error.html | Server error | `error.tsx` | System | Latin digits |
| loading.html | Loading | `loading.tsx` | System | Latin digits |

## Shared components list
See `docs/design/components.md`.

## Token conflicts
See STATUS.md → Conflicts.

## Build order (batches of 3–6 pages)

Batch A (foundation, already Phase 2): tokens, ui, layout.

Batch B (Phase 3): Home.

Batch C: `/listings`, `/categories`, `/listings/[id]`.

Batch D: `/listings/new/step-1..4` (wizard), `/my-items`.

Batch E: `/dashboard`, `/rentals`, `/rentals/[id]`, `/checkout`.

Batch F: `/wallet`, `/messages`, `/profile`.

Batch G: `/settings`, `/reviews`, `/damage-claims`, `/favorites`.

Batch H: `/admin`, `/admin/disputes`.

Batch I: `/how-it-works`, `/about`, `/support`, `/contact`.

Batch J: auth pages (`/login`, `/register`, `/reset-password`).

Batch K: system pages (not-found, error, loading) + integration.

## Defects (cross-cutting)
- Dead links (`href="#"`) → wire per navigation-map.md.
- Latin digits → convert via format.ts.
- English leftovers → translate to Persian.
- Overlapping/misaligned layout → fix with proper flex/grid.
- Missing hover/focus/active states → add.
- Bad responsiveness → fix breakpoints.
- Inconsistent header/footer → use shared components.
- Brand name "RentMo" → "Overa/اورا".
