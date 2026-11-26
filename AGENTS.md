# Overa — Agent Guide (Next.js full-stack conversion)

This file is the single source of conventions for every agent working on this
repository. Read it fully before editing anything.

## 1. What this project is

Overa (اٌوِرا) — Persian-first peer-to-peer rental marketplace. The original
project was 29 static HTML pages (source of truth for visuals: mounted at
`/home/z/my-project/overa-source/overa-marketplace/`). We are converting it
into a Next.js 16 full-stack app **without changing the established visual
identity**. Persian RTL (`lang="fa"`, `dir="rtl"`) is already set in
`src/app/layout.tsx`. All page copy stays Persian.

## 2. Non-negotiable rules

1. **Preserve the visuals.** Reuse the exact Tailwind classes, spacing,
   colors, and composition of the source HTML page you are converting. Do not
   redesign, do not swap the palette, do not add generic shadcn styling where
   the source uses custom markup. shadcn/ui primitives (Dialog, Sheet,
   DropdownMenu, Tabs, Switch, Slider…) may be used only to replace the
   _interactive behavior_ of controls while keeping the source's visual
   classes via `className`.
2. **Guest state rule (critical):** No page may render a hard-coded demo user
   name (سارا محمدی / علی رضایی) as if the visitor were signed in. Where the
   source header shows a user chip, render:
   - guest → the page's own "ورود | ثبت‌نام" style button (from the source)
     linking to `/signin-otp`;
   - signed-in → `<UserMenu user={...} />` from
     `@/components/layout/UserMenu` (client component) placed in the same
     header position.
3. **Server components are the default.** Pages are `async` server components
   in `src/app/(main)/<route>/page.tsx` that read the DB directly via
   `import { db } from "@/lib/db"` and the session via
   `import { getCurrentUser } from "@/lib/auth"`. Interactive parts are
   `"'use client'"` children receiving serializable props.
4. **Never claim real money/escrow/legal effects.** Payment, deposits,
   payouts are SANDBOX/SIMULATION; keep the visible
   "شبیه‌سازی / Sandbox" labels the source uses, and add them where the
   source implies real money.
5. **Every control must do something.** Buttons/links navigate, submit, or
   toggle real state. If a control cannot be functional yet, mark it visibly
   disabled (`disabled` + `title="به‌زودی"`). No dead `href="#"`.
6. **Images:** use `/assets/img/<hash>.jpg` (already in `public/assets/img/`,
   same filenames as the source). Do not use remote image URLs.
7. **Persian numbers** via `src/lib/format.ts` helpers (`faNumber`,
   `faToman`, `faDate`, `faTimeAgo`, `toPersianDigits`, `daysBetween`).
8. **RTL:** `rtl:` variants work. Arrows pointing forward use
   `rtl:rotate-180` as in the source.
9. **Responsive:** every page must work at 390px, 768px, and desktop. The
   source `mobile/*.html` pages are references — do not create separate
   mobile routes.
10. **Never write secrets, never use `bun run build` (dev server auto-runs).**
    Use `bun run lint` to check compile quality before finishing.

## 3. Token mapping (source → this app)

The global theme in `src/app/globals.css` already defines BOTH families used
by the source pages:

Violet family (index/categories/item-details/how-it-works/about/discounts/
tos-support-faq/host-dashboard/arbitration-panel/pages): `bg-primary`,
`bg-primary-dark|light|soft|surface`, `text-accent-gold|emerald|pink`,
`text-neutral-text|muted`, `bg-neutral-bg`, `border-purple-100`,
`shadow-card`, `shadow-card-hover`, `custom-gradient-banner`, `glass-card`,
`badge-gradient-special`, `badge-gradient-hot` — all available unchanged.

Material-3 family (signin*, signup, account-settings, wallet, live-chat,
rentals, rental-lifecycle, my-items, create-listing, reviews, damage-claims,
admin-dashboard, 404/500/loading pages):
available unchanged for unique names — `on-surface`, `on-surface-variant`,
`surface-container-lowest|low|high|highest`, `surface-container`,
`surface-variant`, `surface-dim`, `surface-bright`, `outline-variant`,
`primary-container`, `on-primary-container`, `primary-fixed`,
`primary-fixed-dim`, `on-primary-fixed`, `on-primary-fixed-variant`,
`secondary-container`, `on-secondary-container`, `secondary-fixed`,
`secondary-fixed-dim`, `on-secondary-fixed`, `on-secondary-fixed-variant`,
`tertiary-*`family,`on-background`, `ov-bg`, `ov-blob(-1|-2|-3)`,
`m3-inverse-\*`.

Names that COLLIDED and must be renamed in converted pages:
| source class | use instead |
|---|---|
| `bg-primary` / `text-primary` (on M3 pages where primary=#630ed4) | `bg-m3-primary` / `text-m3-primary` |
| `secondary` (#6849bb) | `m3-secondary` |
| `tertiary` (#4f4c5f) | `m3-tertiary` |
| `background` (#fdf7ff) | `m3-background` |
| `surface` (#fdf7ff) | `m3-surface` |
| `error`, `on-error`, `error-container`, `on-error-container` | `m3-error`, `m3-on-error`, `m3-error-container`, `m3-on-error-container` |
| `outline` (#7b7487) | `m3-outline` |
| `brand-500` / `brand-600` (submit-review) | `bg-m3-primary` / `text-m3-primary` |

Example: signin.html body class `bg-background text-on-surface` becomes
`bg-m3-background text-on-surface`.

If a page defines additional custom classes in its own `<style>` blocks that
are NOT in `globals.css` (e.g. `.ov-…` variants, step connectors), port those
styles into a `<style>` tag inside the page file or equivalent Tailwind
utilities. Keep them page-local; do not edit `globals.css`.

## 4. Route map (old .html → new route)

| Source                              | New route                                 | Notes                                                                                                                       |
| ----------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| index.html                          | `/`                                       | DONE (do not touch)                                                                                                         |
| categories.html                     | `/categories`                             | React mini-app: tabs via `?tab=` (all/camping/cameras/gaming/tools) + `?q=`, `?sort=`; filter/sort wired to `/api/listings` |
| item-details.html                   | `/item-details/[id]`                      | dynamic; data from DB listing; reservation request → `/api/reservations`                                                    |
| how-it-works.html                   | `/how-it-works`                           | static content                                                                                                              |
| about.html                          | `/about`                                  | static content                                                                                                              |
| discounts.html                      | `/discounts`                              | coupon center (demo coupons listed, labelled)                                                                               |
| tos-support-faq.html                | `/tos-support-faq`                        | static content + FAQ accordion                                                                                              |
| signin.html                         | `/signin`                                 | POST `/api/auth/login`; demo hint box                                                                                       |
| signin-otp.html                     | `/signin-otp`                             | POST `/api/auth/otp/request` + `/verify`; shows devCode in demo mode                                                        |
| signup.html                         | `/signup`                                 | POST `/api/auth/register`                                                                                                   |
| account-settings.html               | `/account-settings`                       | protected; profile prefs (client save → `/api/auth/me` PATCH or alert)                                                      |
| rentals.html                        | `/rentals`                                | protected; GET `/api/reservations`                                                                                          |
| rental-lifecycle.html               | `/rental-lifecycle/[id]`                  | protected; one reservation's state machine UI; actions → PATCH `/api/reservations/[id]`                                     |
| submit-review.html                  | `/submit-review`                          | protected; `?reservation=<id>`; POST `/api/reviews`                                                                         |
| live-chat.html                      | `/live-chat`                              | protected; GET/POST `/api/conversations[...]` polling every 4s                                                              |
| wallet.html                         | `/wallet`                                 | protected; GET/POST `/api/wallet`                                                                                           |
| host-dashboard.html                 | `/host-dashboard`                         | protected host; DB queries + PATCH actions                                                                                  |
| my-items.html                       | `/my-items`                               | protected host; listing CRUD → `/api/listings`                                                                              |
| create-listing.html                 | `/create-listing`                         | wizard; POST `/api/listings` (draft or submit)                                                                              |
| reviews.html                        | `/reviews`                                | protected host; reviews list + reply (UI)                                                                                   |
| damage-claims.html                  | `/damage-claims`                          | protected; GET/POST `/api/claims`                                                                                           |
| arbitration-panel.html              | `/arbitration-panel`                      | protected admin; PATCH `/api/admin/claims/[id]`                                                                             |
| admin-dashboard.html                | `/admin-dashboard`                        | protected admin; GET `/api/admin/stats`, moderation                                                                         |
| 404.html                            | `src/app/not-found.tsx`                   | global 404 (also keep `/404` page if simple)                                                                                |
| 500.html                            | `src/app/error.tsx`                       | global error boundary (client comp)                                                                                         |
| loading.html                        | `/loading` + `src/app/(main)/loading.tsx` |                                                                                                                             |
| pages.html                          | `/pages`                                  | sitemap index (not linked in nav)                                                                                           |

All old `*.html` links inside converted markup must be rewritten to the new
routes per this table (strip `.html`, add `/`).

## 5. Shared building blocks (do not duplicate)

- `@/components/layout/SiteHeader` (server) + `SiteFooter` — the exact
  index.html header/footer, session-aware. Use ONLY on pages whose source
  uses that header (index, categories, item-details, how-it-works, about,
  discounts, tos-support-faq, pages, loading).
- `@/components/layout/UserMenu` (client) — authenticated account dropdown.
  Props: `user: { name, avatarUrl, isHost, isAdmin }`.
- `@/components/overa/ListingCard` — the source product card. Props:
  `listing: { id, title, city, area?, dailyPrice, rating, reviewsCount,
instantBook?, discountBadge?, imageUrl }`.
- `@/lib/db` — Prisma client. Models: User, Session, OtpCode, Category,
  Listing, ListingImage, Favorite, Reservation, ReservationEvent,
  Conversation, ConversationParticipant, Message, WalletTransaction, Review,
  DamageClaim, Notification, AuditLog. See `prisma/schema.prisma`.
- `@/lib/auth` — `getCurrentUser()` (null = guest), `createSession`,
  `destroySession`, `hashPassword`, `verifyPassword`, `OTP_DEMO_MODE`.
- `@/lib/rental-state` — `RESERVATION_STATUS_LABELS` (canonical Persian
  labels), `RESERVATION_STATUS_COLORS` (Tailwind classes),
  `allowedActions`, `canAct(status, action, actor)`, `generateReferenceCode`.
  Use these for every reservation status display/action.
- `@/lib/format` — Persian digits/dates.
- shadcn/ui under `@/components/ui/*` (Dialog, Sheet, Tabs, Switch, Slider,
  DropdownMenu, Toast/Sonner, Skeleton, Progress…).

Auth/session data flow for pages with custom headers:

```tsx
// page.tsx (server component)
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
export default async function Page() {
  const user = await getCurrentUser();
  // ...render source header markup; where the source shows the demo user chip:
  {
    user ? (
      <UserMenu
        user={{
          name: user.name,
          avatarUrl: user.avatarUrl,
          isHost: user.isHost,
          isAdmin: user.isAdmin,
        }}
      />
    ) : (
      <a href="/signin-otp" className="...source guest button classes...">
        ورود | ثبت‌نام
      </a>
    );
  }
}
```

Protected pages pattern:

```tsx
import { redirect } from "next/navigation";
const user = await getCurrentUser();
if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/rentals"));
```

Admin pages additionally check `user.isAdmin` (else show the source's
"دسترسی ندارید" empty state or redirect home).

## 6. Client-side data flow

- Forms: `fetch("/api/...", { method: "POST", body: JSON.stringify(...) })`,
  handle loading/error/success in Persian. Never trust client role checks —
  the API enforces them.
- Polling chat: `setInterval` 4000ms on `/api/conversations/[id]/messages`;
  clear on unmount.
- No socket.io / no `io(...)` — the architecture decision is polling
  (Vercel-compatible) for chat.

## 7. Sandbox/demo labelling (mandatory copy)

- Payment steps: «پرداخت آزمایشی (Sandbox) — هیچ پول واقعی جابه‌جا نمی‌شود»
- Wallet/payout: «شبیه‌سازی» badges/notes (the API returns `notice` text)
- OTP: demo box shows the code with «حالت توسعه» label (use the `devCode`
  returned by the API; never hard-code a code in the client)
- Demo accounts hint on signin/signup pages:
  «حساب‌های آزمایشی: اجاره‌دهنده 09121111111 — میزبان 09122222222 — مدیر
  09120000000 — رمز: overa1234»

## 8. Definition of done per page

- Route renders at 200 with real DB data (or static content) and zero
  console errors (check `dev.log`).
- Guest header state correct; no hard-coded names.
- Old .html links rewritten; old hash-route behaviors mapped.
- Responsive at 390px (no horizontal overflow).
- `bun run lint` passes for the files you added.
