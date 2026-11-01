# Architecture Overview

## Stack
- Next.js 14+ (App Router), TypeScript strict, Tailwind CSS.
- State: React context + small stores in `store/` (session, favorites,
  listing-draft, rentals, messages). No global state library needed.
- Forms: react-hook-form + zod (Persian messages).
- UI: custom components (no heavy UI kit) + lucide-react icons.
- Images: next/image with local mock images in `public/images/`.
- Toasts: sonner (or custom).

## Rendering
- Server components by default; client components only where needed
  (interactivity, stores, forms).
- Mock data imported from `data/` (typed).
- No API routes (frontend-only phase).

## Routing groups
- `(main)` — Header + Sidebar + Footer layout; all site pages.
- `(auth)` — centered auth layout.
- Wizard pages under `(main)/listings/new/` share `WizardLayout`.

## Data flow
- Mock data is static arrays; stores hold mutable client state
  (favorites, drafts, rentals, messages, session).
- Submitting add-listing wizard appends to listings store → visible on
  home and my-items.
- Favorites toggle updates store → home cards + favorites page + header
  badge stay in sync.

## RTL
- Root layout sets `<html lang="fa" dir="rtl">`.
- Tailwind logical properties where possible; directional icons mirrored.
