# Pages & Routes

Derived from `docs/stitch/`. Home page design (`home.html`) is source of
truth for tokens and shared layout.

| # | Stitch file | Page | Route | Section | Notes |
|---|-------------|------|-------|---------|-------|
| 1 | home.html (+ mobile) | Home | `/` | Public | Hero carousel, categories, listing grid, filters |
| 2 | Categories.html (+ mobile) | Browse listings | `/listings` | Browse | Full grid with filters/sort/view toggle |
| 3 | Categories & Item Discovery (mobile) | Categories hub | `/categories` | Browse | Category grid → `/listings?cat=` |
| 4 | ItemDetails.html (+ mobile) | Item details & booking | `/listings/[id]` | Browse | Gallery, specs, booking panel, reviews |
| 5 | CreateListing.htm | New listing wizard | `/listings/new/step-1`..`step-4` | Owner | Shared wizard layout + Stepper |
| 6 | MyItems & ManageDrafts.html | My items | `/my-items` | Owner | Listings + drafts management |
| 7 | HostDashboard.html | Host dashboard | `/dashboard` | Owner | Stats, recent bookings, reviews |
| 8 | RentalsPage.html | My rentals | `/rentals` | User | Renter + owner tabs |
| 9 | RentalLifecycleManagement.html | Rental detail | `/rentals/[id]` | User | Booking, delivery, return, deposit |
| 10 | (derived) | Checkout | `/checkout` | User | Derived from rental lifecycle design |
| 11 | Wallet & Deposits.html | Wallet | `/wallet` | User | Balances, bank accounts, escrow |
| 12 | LiveChat.html (+ mobile) | Messages | `/messages` | User | Conversation list + thread |
| 13 | My Rentals & Profile (mobile) | Profile | `/profile` | User | User profile + stats |
| 14 | AccountSettings.html | Settings | `/settings` | User | Account, security, payouts, prefs |
| 15 | ReviewsAndFeedback.html | Reviews | `/reviews` | User | Given/received reviews |
| 16 | DamageClaimsAndDisputeResolution.html | Damage claim | `/damage-claims` | User | Report damage/dispute |
| 17 | DamageAndDepositArbitrationPanel.html | Dispute arbitration | `/admin/disputes` | Admin | Evidence, decision |
| 18 | PlatformAdminDashboard.html | Admin dashboard | `/admin` | Admin | Platform overview |
| 19 | HowItWorks.html | How it works | `/how-it-works` | Public | Steps + FAQ |
| 20 | AboutUs.html | About | `/about` | Public | Story, values, team |
| 21 | Tos & Support & FAQ.html | Support | `/support` | Public | FAQ, terms, contact |
| 22 | (derived) | Contact | `/contact` | Public | Contact form (reuses support) |
| 23 | (derived) | Favorites | `/favorites` | User | Saved listings |
| 24 | SignIn.html | Login | `/login` | Auth | Password login |
| 25 | SignInWithOTP.html | Login (OTP) | `/login` (tab) | Auth | OTP flow (tab on login) |
| 26 | SignUp.html | Register | `/register` | Auth | Registration |
| 27 | (derived) | Reset password | `/reset-password` | Auth | Derived from SignIn |
| 28 | NotFoundPage.html | Not found | `not-found.tsx` | System | 404 |
| 29 | 500_Internal_Server_Error.html | Server error | `error.tsx` | System | 500 |
| 30 | loading.html | Loading | `loading.tsx` | System | Skeleton/loading |

Auth layout: `(auth)/`. Main layout: `(main)/`. Wizard layout: shared stepper under `(main)/listings/new/`.

Protected routes redirect to `/login` when no session.
