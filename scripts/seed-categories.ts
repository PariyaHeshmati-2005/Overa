/**
 * Overa — categories-only structural seed.
 *
 * WHY THIS EXISTS: categories are STRUCTURAL data (the create-listing wizard,
 * filters and search all break without them), not demo content. The demo seed
 * (scripts/seed.ts) deliberately refuses remote/production databases, so a
 * fresh production database (e.g. Neon) would stay empty forever. This script
 * fills ONLY the 8 platform categories and is safe to run on ANY database:
 *
 *  - create-only (upsert by slug): never renames/overwrites your categories
 *  - re-runnable: running it twice changes nothing
 *  - touches no users, listings, reservations or financial data
 *
 * Run:  bun run db:seed:categories
 *   (== bunx prisma migrate deploy && bun run scripts/seed-categories.ts)
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const CATEGORY_DATA = [
  { slug: "digital", name: "لوازم دیجیتال", icon: "devices" },
  { slug: "home", name: "لوازم خانگی", icon: "home" },
  { slug: "sport", name: "ورزش و تفریح", icon: "sports_soccer" },
  { slug: "tools", name: "ابزار و تجهیزات", icon: "handyman" },
  { slug: "camping", name: "سفر و کمپینگ", icon: "forest" },
  { slug: "beauty", name: "مد و زیبایی", icon: "checkroom" },
  { slug: "kids", name: "کودک و نوزاد", icon: "child_care" },
  { slug: "other", name: "سایر دسته‌ها", icon: "category" },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* local/file URLs */
  }
  console.log(`Seeding platform categories into ${host || "(local database)"} …`);

  let created = 0;
  let existing = 0;
  for (const [i, c] of CATEGORY_DATA.entries()) {
    const found = await db.category.findUnique({ where: { slug: c.slug } });
    if (found) {
      existing++;
      continue;
    }
    await db.category.create({
      data: { slug: c.slug, name: c.name, icon: c.icon, sortOrder: i },
    });
    created++;
    console.log(`  + ${c.slug} — ${c.name}`);
  }

  const total = await db.category.count();
  console.log(
    `Done. categories: total=${total}, created=${created}, already-present=${existing}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
