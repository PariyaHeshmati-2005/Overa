# Design System

Source of truth: `docs/stitch/home.html` tailwind config. Other Stitch
`DESIGN_*.md` files use a different (Material 3) palette and are
**not** authoritative; conflicts are recorded in `docs/progress/STATUS.md`.

## Tokens (tailwind.config.ts)

### Colors
- primary.DEFAULT `#4C2A9E`, primary.dark `#3A1E7B`, primary.light `#8B5CF6`,
  primary.soft `#EDE7FF`, primary.surface `#F5F0FF`
- accent.gold `#F5A623`, accent.emerald `#10B981`, accent.pink `#EC4899`
- neutral.text `#1F1B2E`, neutral.muted `#6B6880`, neutral.border `#E8E3F5`,
  neutral.card `#FFFFFF`, neutral.bg `#F9F7FD`
- body background `#F8F6FC` (globals.css)

### Typography
- Font family: `Vazirmatn` (weights 300–900) for all text. No second
  display font. Persian UI.
- Base size 16px, line-height ~1.6 for body.

### Radius
- `rounded` 8px (inputs, chips, cells)
- `rounded-lg` 16px (buttons, badges, profile cards, media)
- `rounded-xl` 24px (product cards, review containers, booking panel)
- `rounded-full` (status badges, avatars, pills)

### Shadows
- `shadow-card`: `0 8px 28px -6px rgba(76,42,158,0.08)`
- `shadow-card-hover`: `0 16px 36px -4px rgba(76,42,158,0.15)`
- `shadow-glow`: `0 0 20px rgba(139,92,246,0.35)`

### Spacing
- Container gutter 1.5rem (desktop), 1rem (mobile). Page margin 2rem/1rem.

## RTL rules
- `<html lang="fa" dir="rtl">`.
- Vazirmatn font.
- All numbers, prices, dates, ratings, counts in Persian digits (۰-۹)
  via `lib/format.ts` (`toPersianDigits`).
- Prices: "۲,۵۰۰,۰۰۰ تومان / روز".
- Directional icons (arrows/chevrons) mirrored: use `rtl:rotate-180` or
  logical properties.
- Text alignment right by default.

## Component rules
- No hardcoded colors/magic values in components; use tokens.
- Shared components built once in `components/ui/*`.
- All interactive elements have hover/focus/active/disabled/loading states.
- Tap targets ≥ 44px on mobile.
- Focus rings visible (violet glow).

## Conflicts recorded
- Stitch `DESIGN_*.md` exports use Material 3 palette (#7C3AED primary,
  Plus Jakarta Sans). Home page uses #4C2A9E / Vazirmatn. Home wins.
  See STATUS.md.
- Some Stitch pages use "RentMo" brand name; Overa wins.
- English leftovers and Latin digits in Stitch must be converted to
  Persian during porting.
