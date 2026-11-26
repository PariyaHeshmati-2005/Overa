import { jsonError, jsonOk } from "@/lib/api";

/**
 * GET /api/geo/search?q=&lat=&lon= — address search for the location picker.
 *
 * Proxies OpenStreetMap's Nominatim service server-side so the browser never
 * hits it directly (proper User-Agent, single choke point, cacheable). In
 * sandbox/offline deployments it degrades gracefully: the caller shows a hint
 * to pick the spot manually on the map instead.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const lat = Number(url.searchParams.get("lat") ?? "") || 35.6892;
  const lon = Number(url.searchParams.get("lon") ?? "") || 51.389;
  if (q.length < 2) return jsonError("عبارت جستجو کوتاه است.");

  const upstream = new URL("https://nominatim.openstreetmap.org/search");
  upstream.searchParams.set("q", q);
  // Bias results around the current city center (viewbox + position).
  upstream.searchParams.set("viewbox", `${lon - 1},${lat + 1},${lon + 1},${lat - 1}`);
  upstream.searchParams.set("lat", String(lat));
  upstream.searchParams.set("lon", String(lon));
  upstream.searchParams.set("format", "jsonv2");
  upstream.searchParams.set("addressdetails", "0");
  upstream.searchParams.set("limit", "5");
  upstream.searchParams.set("accept-language", "fa");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(upstream, {
      signal: controller.signal,
      headers: { "User-Agent": "Overa/0.2 (rental marketplace; contact: overa.local)" },
    });
    clearTimeout(timer);
    if (!res.ok) return jsonError("سرویس جستجوی آدرس پاسخ نداد؛ روی نقشه انتخاب کنید.", 502);
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) return jsonOk({ results: [] });
    const results = rows
      .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
      .map((r) => ({
        display_name: String(r.display_name ?? ""),
        lat: String(r.lat ?? ""),
        lon: String(r.lon ?? ""),
      }))
      .filter((r) => r.display_name && r.lat && r.lon);
    return jsonOk({ results });
  } catch {
    return jsonError("سرویس جستجوی آدرس در دسترس نیست؛ روی نقشه انتخاب کنید.", 503);
  }
}
