# Folder Structure

```
overa/
├── AGENTS.md  CLAUDE.md  README.md  .gitignore  .env.example
├── package.json  next.config.ts  tsconfig.json  tailwind.config.ts
├── postcss.config.mjs  eslint.config.mjs
├── docs/
│   ├── README.md
│   ├── product/ vision.md  scope.md  pages.md
│   ├── design/  design-system.md  components.md  navigation-map.md
│   ├── architecture/ overview.md  folder-structure.md  conventions.md
│   ├── agents/  workflow.md  skills.md  definition-of-done.md
│   ├── progress/ STATUS.md  PLAN.md  roadmap.md
│   ├── stitch/   (read-only reference, gitignored)
│   └── skill/    (vendor skills, gitignored; note: singular in repo)
├── public/ images/ (hero, listings, illustrations), logo.svg, favicon
├── app/
│   ├── layout.tsx  globals.css  not-found.tsx  error.tsx  loading.tsx
│   ├── (main)/  layout.tsx + all site pages
│   └── (auth)/  layout.tsx + login/ register/ reset-password/
├── components/
│   ├── ui/  components/layout/  domain folders
├── data/    typed mock data
├── lib/     format.ts  utils.ts  validations.ts
├── store/   session favorites listing-draft (mock shared state)
├── hooks/   types/
```
Note: docs/skill (singular) is the actual vendor folder name in this repo.
