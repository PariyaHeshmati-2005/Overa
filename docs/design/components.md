# Component Inventory

## Layout (`components/layout/`)
- `Header` — top nav, search, user menu, cart/favorites counts.
- `Sidebar` — desktop side navigation (filters on listings, nav on dashboard).
- `Footer` — links, newsletter, social.
- `MobileBottomNav` — bottom tab bar (home, search, favorites, messages, profile).
- `PageContainer` — max-width wrapper with responsive padding.
- `AuthLayout` — centered card layout for auth pages.
- `WizardLayout` — stepper + step content + nav buttons.

## UI primitives (`components/ui/`)
- `Button` (variants: primary, secondary, ghost, danger; sizes sm/md/lg; loading)
- `Input`, `Textarea`, `Select`, `Checkbox`, `Toggle`, `Radio`
- `Card` (variants: default, elevated, outlined)
- `Badge` (status colors)
- `Modal` / `Dialog`
- `Tabs`
- `Rating` (stars + count)
- `Avatar`
- `Pagination`
- `Breadcrumb`
- `Toast` (via sonner or custom)
- `Stepper`
- `Skeleton` / `Spinner`
- `EmptyState`
- `PriceTag`
- `ImageGallery`
- `Calendar` (date range picker, RTL)
- `FilterChip`
- `Tooltip`

## Domain components
- `home/`: HeroCarousel, CategoryGrid, ListingCard, SortBar, ViewToggle
- `listings/`: ListingGrid, FilterSidebar, FilterSheet (mobile), ListingCard
- `wizard/`: StepCategory, StepDetails, StepPhotos, StepPricing
- `auth/`: LoginForm, RegisterForm, OtpForm
- `rentals/`: RentalCard, StatusBadge, Timeline
- `messages/`: ConversationList, MessageThread, Composer
- `dashboard/`: StatCard, RecentBookings, ReviewList

Rule: build once, reuse. Add new shared component only if missing and
needed by ≥2 pages.
