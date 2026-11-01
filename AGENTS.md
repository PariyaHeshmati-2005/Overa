# AGENTS.md — Overa (اورا)

Frontend-only Persian (RTL) peer-to-peer rental marketplace.

## Reading order
1. This file
2. docs/product/vision.md, scope.md, pages.md
3. docs/design/design-system.md, components.md, navigation-map.md
4. docs/architecture/* 
5. docs/agents/* 
6. docs/progress/STATUS.md, PLAN.md

## Non-negotiable rules
1. Stack: Next.js App Router + TS strict + Tailwind.
2. RTL everywhere: `<html lang="fa" dir="rtl">`, Vazirmatn, Persian digits for
   all numbers/prices/dates/ratings/counts. Prices "۲,۵۰۰,۰۰۰ تومان / روز".
   All UI copy Persian. Mirror directional icons.
3. Tokens from docs/design/design-system.md (home page source of truth).
   Define once in tailwind.config.ts + globals.css. No hardcoded colors.
4. Never import/copy whole Stitch file; rewrite as small typed components.
5. Build shared parts once; reuse.
6. Fix Stitch defects when porting.
7. No placeholders, dead links, empty files.
8. Mock data realistic Persian.
9. Responsive: desktop-first + tablet + mobile (bottom tab bar, filter sheet).
10. Keep folder structure. No rename/move.
11. Git: small commits, conventional commits.
12. After every phase update STATUS.md then commit.
13. Verify after building: lint + build + dev server + browser compare.

## Skills
Read relevant SKILL.md before each kind of work (see docs/agents/skills.md).
Never use supabase/docker now.

## Folder structure
See docs/architecture/folder-structure.md.

## Definition of done
See docs/agents/definition-of-done.md.
