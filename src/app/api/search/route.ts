import { jsonError, jsonOk, parseIntSafe } from "@/lib/api";
import { searchListings } from "@/lib/search";

/**
 * GET /api/search?q=&limit= — real database search.
 * Returns only ACTIVE (publicly visible) listings matching the query across
 * title, brand, description, specs, city and category name, with Persian
 * normalization applied (Arabic yeh/kaf, ZWNJ, diacritics, digits).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = parseIntSafe(url.searchParams.get("limit"), 8);

  try {
    const result = await searchListings(q, limit);
    return jsonOk(result);
  } catch {
    return jsonError("خطای غیرمنتظره در جستجو. بعداً دوباره تلاش کنید.", 500);
  }
}
