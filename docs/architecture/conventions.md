# Conventions

## Naming
- Components: PascalCase files (`Button.tsx`), default export.
- Hooks: `useX.ts` in `hooks/`.
- Utils: camelCase exports.
- Routes: kebab-case folders.
- Types: `types/` or colocated; prefer domain types in `data/`.

## File layout
- One component per file; small files.
- Server component by default; add `"use client"` only when needed.
- Colocate styles via Tailwind classes; no CSS modules except globals.

## RTL
- Root `<html lang="fa" dir="rtl">`.
- Use logical properties (`ms-`, `me-`, `ps-`, `pe-`) where helpful.
- Mirror directional icons with `rtl:rotate-180`.

## Porting a Stitch page
1. Read the HTML; identify sections and shared components.
2. Rewrite as components; never copy whole file.
3. Fix defects: dead links, Latin digits, English leftovers, overlap,
   responsiveness, missing states.
4. Use tokens only; no hardcoded colors.
5. Wire navigation per navigation-map.md.
6. Verify at 1440/1024/768/390px.

## Commits
- Conventional Commits: `feat(scope): ...`, `fix:`, `docs:`, `chore:`.
- One logical change per commit.

## Digits
- All user-facing numbers via `toPersianDigits` / `formatPrice` /
  `formatDate` from `lib/format.ts`.
