import "server-only";
import { db } from "@/lib/db";
import {
  buildListingSearchKey,
  normalizePersian,
  queryTokens,
} from "@/lib/persian";

export type SearchHit = {
  id: string;
  title: string;
  city: string;
  area: string | null;
  dailyPrice: number;
  rating: number;
  reviewsCount: number;
  instantBook: boolean;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
};

export type SearchResult = {
  query: string;
  total: number;
  results: SearchHit[];
};

/**
 * Real database-backed search over ACTIVE listings.
 *
 * Matching happens against `Listing.searchKey` — a normalized (Arabic→Persian,
 * ZWNJ-stripped, digit-folded, lowercased) copy of title + brand + specs +
 * description + city + category name that is maintained on every write path
 * (create/update/seed) and can be rebuilt with scripts/backfill-search-keys.ts.
 *
 * A query matches when:
 *  - the full normalized phrase is contained in the key, OR
 *  - every normalized word of the query is contained, OR
 *  - the query matches a category name (returns that category's listings).
 *
 * All matching is done through Prisma's parameterized `contains` filters —
 * user input never reaches raw SQL, so it is injection-safe by construction.
 */
export async function searchListings(
  rawQuery: string,
  limit = 24
): Promise<SearchResult> {
  const query = (rawQuery ?? "").trim();
  const tokens = queryTokens(query);
  if (tokens.length === 0) {
    return { query, total: 0, results: [] };
  }
  const phrase = tokens.join(" ");

  // Category-name matching (e.g. «کمپینگ») pulls whole categories in.
  const categories = await db.category.findMany({
    select: { id: true, name: true },
  });
  const categoryIds = categories
    .filter((c) => {
      const n = normalizePersian(c.name);
      return tokens.some(
        (t) => n.includes(t) || (t.length >= 3 && n.includes(t))
      );
    })
    .map((c) => c.id);

  const where = {
    status: "ACTIVE" as const,
    OR: [
      { searchKey: { contains: phrase } },
      // AND of all words: each word must appear somewhere in the key.
      ...(() => {
        const wordConditions = tokens.map((t) => ({
          searchKey: { contains: t },
        }));
        return wordConditions.length > 1 ? [{ AND: wordConditions }] : [];
      })(),
      ...(categoryIds.length ? [{ categoryId: { in: categoryIds } }] : []),
    ],
  };

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
      take: Math.min(Math.max(limit, 1), 60),
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.listing.count({ where }),
  ]);

  const results: SearchHit[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    city: l.city,
    area: l.area,
    dailyPrice: l.dailyPrice,
    rating: l.rating,
    reviewsCount: l.reviewsCount,
    instantBook: l.instantBook,
    categoryName: l.category.name,
    categorySlug: l.category.slug,
    imageUrl: l.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg",
  }));

  return { query, total, results };
}

/** Re-export so write-paths and scripts share one implementation. */
export { buildListingSearchKey, normalizePersian };
