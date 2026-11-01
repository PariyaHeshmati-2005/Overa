# Navigation Map

Intended navigation (Stitch exports contain no real links; this map is
the contract for Phase 4/5).

## Header (all main pages)
- Logo → `/`
- Search bar → `/listings?q=`
- Categories → `/categories`
- How it works → `/how-it-works`
- Favorites icon → `/favorites` (badge count)
- Messages icon → `/messages` (badge count)
- User menu: Profile → `/profile`, My items → `/my-items`,
  Rentals → `/rentals`, Wallet → `/wallet`, Settings → `/settings`,
  Dashboard (host) → `/dashboard`, Admin → `/admin` (if admin),
  Logout → `/login`

## Footer
- About → `/about`
- How it works → `/how-it-works`
- Support/FAQ → `/support`
- Terms → `/support#terms`
- Contact → `/contact`

## Home
- Hero CTA "جستجو" → `/listings`
- Category chip → `/listings?cat=<id>`
- Listing card → `/listings/[id]`
- Favorite toggle → store update (toast)
- "مشاهده همه" → `/listings`

## Listings
- Filter apply → URL query update + grid refresh
- Card → `/listings/[id]`
- Sort → URL query

## Item details
- Owner avatar → `/profile/[ownerId]` (or `/profile`)
- Book button → `/checkout?listing=`
- Favorite → store
- Share → toast
- Reviews "مشاهده همه" → `/reviews?listing=`

## Checkout
- Pay → mock success → `/rentals/[id]` + toast
- Back → `/listings/[id]`

## Rentals
- Row → `/rentals/[id]`
- New rental CTA → `/listings`

## Rental detail
- Message owner → `/messages?conversation=`
- Report damage → `/damage-claims?rental=`
- Leave review → modal → `/reviews`

## Messages
- Conversation → thread
- Send → append message (mock)

## Dashboard (host)
- Add listing → `/listings/new/step-1`
- Manage items → `/my-items`
- Rental row → `/rentals/[id]`

## My items
- Edit → `/listings/new/step-1?edit=`
- View → `/listings/[id]`
- New → `/listings/new/step-1`

## Admin
- Dispute row → `/admin/disputes/[id]`

## Auth
- Login success → `/` (or intended redirect)
- Register → `/login`
- Logout → `/login`

## Mobile bottom nav
- Home, Search, Favorites, Messages, Profile
