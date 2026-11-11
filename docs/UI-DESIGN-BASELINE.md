# Overa — Visual design baseline (preserved)

The source project was presented to real people; its look is a release
requirement, not a suggestion. This file records the tokens actually in use
so future agents do not drift.

## 1. Typography

- **Vazirmatn** (local, `public/assets/fonts/`) — Persian, all weights
  300–900. Default `font-sans`.
- **Plus Jakarta Sans** — Latin fragments (product names like "Sony Alpha").
- **Material Symbols Outlined** — icon font used by the M3 pages
  (`material-symbols-outlined` class comes from the local `fonts.css`).
- `lang="fa" dir="rtl"` set at the root; forward arrows use `rtl:rotate-180`.

## 2. Color tokens (exact source values)

Violet family (`tailwind.config` of index/categories/item-details/…):

| Token | Value |
|---|---|
| `primary` | `#4C2A9E` |
| `primary.dark` | `#3A1E7B` |
| `primary.light` | `#8B5CF6` |
| `primary.soft` | `#EDE7FF` |
| `primary.surface` | `#F5F0FF` |
| `accent.gold` | `#F5A623` |
| `accent.emerald` | `#10B981` |
| `accent.pink` | `#EC4899` |
| `neutral.text` | `#1F1B2E` |
| `neutral.muted` | `#6B6880` |
| `neutral.border` | `#E8E3F5` |
| `neutral.card` | `#FFFFFF` |
| `neutral.bg` | `#F9F7FD` |
| body background | `#f8f6fc` |

Material-3 family (signin*, signup, account-settings, wallet, live-chat,
dashboards…): `primary #630ED4`, `on-surface #1D192C`,
`on-surface-variant #4A4455`, `surface-container-lowest #FFFFFF`,
`surface-container #F2EBFF`, `outline-variant #CCC3D8`,
`error #BA1A1A` — full table in `src/app/globals.css` (`m3-` prefix on the
four colliding names).

Shadows: `shadow-card 0 8px 28px -6px rgba(76,42,158,.08)`,
`shadow-card-hover 0 16px 36px -4px rgba(76,42,158,.15)`.

Decorations: `custom-gradient-banner` (violet overlay on
`assets/img/cc4888ebfe4f.jpg`), `glass-card`, `badge-gradient-special`,
`badge-gradient-hot`, `ov-bg` dotted mesh + `ov-blob` blur blobs.

## 3. Signature components

- Product card: `rounded-3xl border-purple-100 shadow-card`, image h-44 with
  hover zoom, favorite button, Persian rating/location row, price
  `font-black text-primary` + «تومان / روز».
- Header (index family): sticky, `bg-white/95 backdrop-blur-md`, brand block
  with logo + «اٌوِرا» in `#801E76`, pill search, round icon buttons, bottom
  nav with primary underline for the active item.
- Guest auth control: primary pill «ورود | ثبت‌نام» → `/signin-otp`.
  Authenticated control: `UserMenu` avatar chip + dropdown (same position).
- Status chips: see `RESERVATION_STATUS_COLORS` (`src/lib/rental-state.ts`).

## 4. Baseline screenshots

Captured during implementation (browser, dev server):

| Page | Viewport | Notes |
|---|---|---|
| `/` (guest + signed-in) | 1440×900 | hero banner, filters, grid, trust strip, app banner |
| `/rentals` | 1440×900 | real stats, tabs, sandbox wallet strip |
| `/rental-lifecycle/[id]` | 1440×900 | stepper, agreement tabs, event timeline |
| `/categories` | full page | all seven tabs, hero, cards |

Mobile responsiveness is implemented via Tailwind breakpoints
(390/768/desktop) following the five `mobile/*.html` references; no separate
mobile routes were created.

## 5. Approved localized changes (with reasons)

| Change | Reason |
|---|---|
| Shared session-aware header control (`UserMenu`) on all pages | cross-page guest/auth invariant required by the playbook — replaces hard-coded demo names |
| Payment/deposit/wallet copy gains «شبیه‌سازی (Sandbox)» labels | truthfulness rule — no real provider is configured |
| 500-page escrow/provider claims softened to sandbox wording | source claimed live provider operation that does not exist |
| App-store buttons in the download banner are non-interactive (title «به‌زودی») | no shipped binaries; dead links are prohibited |
| Item-details map button disabled («به‌زودی») | no map service integrated |
| Image picker in the wizard uses the bundled asset pool | upload storage not yet connected |

Everything else — composition, spacing, colors, typography, copy — is
unchanged from the source pages.
