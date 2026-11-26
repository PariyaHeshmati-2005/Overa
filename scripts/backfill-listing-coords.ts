/**
 * Backfill exact map coordinates for listings that have none.
 *
 * Deterministic per listing id: the pin is placed near the city centroid
 * (± ~0.02° ≈ 2 km jitter) so seeded/legacy listings show a realistic,
 * stable neighbourhood on every map in the app. Listings that already carry
 * lat/lng are left untouched. Idempotent — safe to run repeatedly.
 *
 * Usage: bun run scripts/backfill-listing-coords.ts  (npm run db:coords)
 */
import { db } from "../src/lib/db";
import { cityCenter } from "../src/lib/geo";

/** Stable 0..1 pseudo-random from a cuid (deterministic across runs). */
function hashUnit(id: string, salt: string): number {
  let h = 2166136261;
  const src = `${id}:${salt}`;
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

async function main() {
  const listings = await db.listing.findMany({
    where: { lat: null, lng: null },
    select: { id: true, city: true, area: true },
  });
  console.log(
    `Backfilling coordinates for ${listings.length} listing(s) without lat/lng…`,
  );
  let updated = 0;
  for (const l of listings) {
    const c = cityCenter(l.city);
    const lat = c.lat + (hashUnit(l.id, "lat") - 0.5) * 0.04;
    const lng = c.lng + (hashUnit(l.id, "lng") - 0.5) * 0.04;
    await db.listing.update({
      where: { id: l.id },
      data: { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 },
    });
    updated += 1;
  }
  console.log(`Done — ${updated} listing(s) received coordinates.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
