/**
 * Backfills Listing.searchKey for every listing in the database.
 * Idempotent and non-destructive: recomputes the normalized search key from
 * current title/brand/specs/description/city/category and writes it only when
 * it differs. Safe to run any time (e.g. after upgrading from a version that
 * did not maintain searchKey, or after importing legacy data).
 *
 * Run: bun run scripts/backfill-search-keys.ts
 */
import { PrismaClient } from "@prisma/client";
import { buildListingSearchKey } from "../src/lib/persian";

const db = new PrismaClient();

async function main() {
  const listings = await db.listing.findMany({
    select: {
      id: true,
      title: true,
      brand: true,
      specs: true,
      description: true,
      city: true,
      searchKey: true,
      category: { select: { name: true } },
    },
  });

  let changed = 0;
  for (const l of listings) {
    const key = buildListingSearchKey({
      title: l.title,
      brand: l.brand,
      specs: l.specs,
      description: l.description,
      city: l.city,
      categoryName: l.category?.name ?? null,
    });
    if (key !== l.searchKey) {
      await db.listing.update({ where: { id: l.id }, data: { searchKey: key } });
      changed += 1;
    }
  }
  console.log(
    `Backfill complete — ${listings.length} listings scanned, ${changed} search keys updated.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
