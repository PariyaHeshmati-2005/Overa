/**
 * Overa — legacy listings importer (old-site data → new Prisma/PostgreSQL DB).
 *
 * PURPOSE: when the platform moves to a fresh production database (e.g. Neon),
 * the products of the previous site must be carried over. Export them from the
 * old system into a JSON file (shape below) and run this script. It is
 * STRICTLY ADDITIVE: it creates missing listings and never updates, deletes
 * or overwrites anything that already exists.
 *
 * Input JSON (array; unknown fields are ignored):
 * [
 *   {
 *     "title": "دوربین سونی A7 IV",              // required
 *     "category": "digital",                      // slug OR exact Persian name, required
 *     "brand": "Sony Alpha",
 *     "description": "...",
 *     "specs": "...",
 *     "dailyPrice": 950000,                       // Toman, required
 *     "weeklyPrice": 5100000,
 *     "deposit": 6000000,
 *     "city": "تهران",                            // default تهران
 *     "area": "ونک",
 *     "images": ["75c37134b4d1.jpg", "https://…"], // bare file names resolve to /assets/img/<name>
 *     "status": "ACTIVE",                          // ACTIVE (default) | PENDING | DRAFT | PAUSED
 *     "instantBook": false,
 *     "deliveryCourier": false,
 *     "pickupInPerson": true
 *   }
 * ]
 *
 * Usage:
 *   bun run scripts/import-listings.ts --file=./legacy-listings.json \
 *        --owner-phone=0912xxxxxxx [--status=ACTIVE] [--dry-run]
 *
 * Notes:
 *  - The owner account must ALREADY exist (sign up once, or use create-admin).
 *    This script never fabricates owners/phones — real ownership must be real.
 *  - Duplicate protection: a listing is skipped when the same owner already
 *    has a listing with the same title.
 *  - searchKey (Persian-normalized) is computed for every imported row, so
 *    DB search works immediately; /search also has a backfill script.
 */
import { PrismaClient } from "@prisma/client";
import { buildListingSearchKey } from "../src/lib/persian";

const db = new PrismaClient();

type LegacyListing = {
  title: string;
  category: string;
  brand?: string;
  description?: string;
  specs?: string;
  dailyPrice: number;
  weeklyPrice?: number | null;
  deposit?: number;
  city?: string;
  area?: string;
  images?: string[];
  status?: string;
  instantBook?: boolean;
  deliveryCourier?: boolean;
  pickupInPerson?: boolean;
};

const ALLOWED_STATUS = new Set(["ACTIVE", "PENDING", "DRAFT", "PAUSED"]);

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function parseArgs(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([a-zA-Z-]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function normalizeImage(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t) || t.startsWith("/")) return t;
  return `/assets/img/${t}`;
}

async function main() {
  const args = parseArgs();
  const filePath = args.file;
  const ownerPhone = args["owner-phone"];
  const dryRun = args["dry-run"] === "1" || args["dry-run"] === "true";
  const defaultStatus = (args.status ?? "ACTIVE").toUpperCase();

  if (!filePath) fail("--file=<path-to-json> is required.");
  if (!ownerPhone || !/^0\d{10}$/.test(ownerPhone))
    fail("--owner-phone=09XXXXXXXXX is required (an EXISTING account's phone).");
  if (!ALLOWED_STATUS.has(defaultStatus))
    fail(`--status must be one of: ${[...ALLOWED_STATUS].join(", ")}`);

  const owner = await db.user.findUnique({ where: { phone: ownerPhone } });
  if (!owner)
    fail(
      `No user with phone ${ownerPhone}. Register this account in the app first — ` +
        `the importer never creates fabricated owners.`
    );

  let raw: string;
  try {
    raw = await import("node:fs").then((fs) => fs.readFileSync(filePath, "utf-8"));
  } catch {
    fail(`Cannot read ${filePath}.`);
  }

  let items: LegacyListing[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) fail("JSON root must be an array of listings.");
    items = parsed;
  } catch (e) {
    fail(`Invalid JSON: ${(e as Error).message}`);
  }

  const categories = await db.category.findMany();
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const byName = new Map(categories.map((c) => [c.name, c]));

  let created = 0;
  let skippedDup = 0;
  let errors = 0;

  for (const [i, item] of items.entries()) {
    const label = `#${i + 1} "${item.title ?? "?"}"`;
    try {
      if (!item.title || !item.title.trim()) throw new Error("missing title");
      if (typeof item.dailyPrice !== "number" || item.dailyPrice <= 0)
        throw new Error(`invalid dailyPrice: ${item.dailyPrice}`);

      const cat =
        bySlug.get((item.category ?? "").trim()) ??
        byName.get((item.category ?? "").trim());
      if (!cat)
        throw new Error(
          `unknown category "${item.category}" (use a slug like digital/home/sport/tools/camping/beauty/kids/other or an exact Persian name)`
        );

      const dup = await db.listing.findFirst({
        where: { ownerId: owner.id, title: item.title.trim() },
        select: { id: true },
      });
      if (dup) {
        skippedDup++;
        console.log(`  ↷ ${label} — already imported (same owner+title), skipped`);
        continue;
      }

      if (dryRun) {
        console.log(`  ✓ ${label} — would be created (category: ${cat.slug})`);
        created++;
        continue;
      }

      const status = ALLOWED_STATUS.has((item.status ?? "").toUpperCase())
        ? (item.status ?? "").toUpperCase()
        : defaultStatus;

      const cityName = (item.city ?? "تهران").trim() || "تهران";
      await db.listing.create({
        data: {
          ownerId: owner.id,
          categoryId: cat.id,
          title: item.title.trim(),
          description:
            item.description?.trim() ||
            "وسیله‌ای باکیفیت برای اجاره کوتاه‌مدت در اورا؛ تحویل منظم و تمیز، آماده استفاده.",
          brand: item.brand?.trim() || null,
          specs: item.specs?.trim() || null,
          searchKey: buildListingSearchKey({
            title: item.title.trim(),
            brand: item.brand,
            specs: item.specs,
            description: item.description,
            city: cityName,
            categoryName: cat.name,
          }),
          dailyPrice: Math.round(item.dailyPrice),
          weeklyPrice:
            typeof item.weeklyPrice === "number" && item.weeklyPrice > 0
              ? Math.round(item.weeklyPrice)
              : null,
          deposit: Math.max(0, Math.round(item.deposit ?? 0)),
          city: cityName,
          area: item.area?.trim() || null,
          instantBook: item.instantBook ?? false,
          deliveryCourier: item.deliveryCourier ?? false,
          pickupInPerson: item.pickupInPerson ?? true,
          status,
          isDemo: false, // legacy/real content — never labelled as demo
          images: {
            create: (item.images ?? [])
              .map(normalizeImage)
              .filter(Boolean)
              .slice(0, 8)
              .map((url, idx) => ({ url, sortOrder: idx })),
          },
        },
        select: { id: true },
      });
      created++;
      console.log(`  ✓ ${label} — created (category: ${cat.slug}, status: ${status})`);
    } catch (e) {
      errors++;
      console.error(`  ✗ ${label} — ${(e as Error).message}`);
    }
  }

  console.log(
    `\nImport finished. created=${created}, duplicates-skipped=${skippedDup}, errors=${errors}.`
  );
  if (errors > 0) process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
