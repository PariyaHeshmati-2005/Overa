/**
 * Lightweight geo helpers for the Overa map components.
 *
 * Listings carry optional exact coordinates (Listing.lat/lng). When they are
 * missing (legacy/seeded rows), the city centroid is used as a fallback so
 * every map in the app always shows the right neighbourhood of the item.
 */

export type CityCenter = { lat: number; lng: number; zoom: number };

/** Centroids of the cities supported by the create-listing wizard. */
export const CITY_CENTERS: Record<string, CityCenter> = {
  "تهران": { lat: 35.6892, lng: 51.389, zoom: 12 },
  "شمیرانات": { lat: 35.8047, lng: 51.4394, zoom: 12 },
  "ری": { lat: 35.593, lng: 51.458, zoom: 12 },
  "پردیس": { lat: 35.7436, lng: 51.9261, zoom: 12 },
  "کرج": { lat: 35.8355, lng: 50.9915, zoom: 12 },
  "مهرشهر": { lat: 35.796, lng: 51.01, zoom: 13 },
  "اصفهان": { lat: 32.6539, lng: 51.666, zoom: 12 },
  "کاشان": { lat: 33.985, lng: 51.41, zoom: 13 },
  "شیراز": { lat: 29.5918, lng: 52.5837, zoom: 12 },
  "مشهد": { lat: 36.2605, lng: 59.6168, zoom: 12 },
  "نیشابور": { lat: 36.2133, lng: 58.7958, zoom: 13 },
};

/** Tehran fallback for unknown cities. */
export const DEFAULT_CENTER: CityCenter = {
  lat: 35.6892,
  lng: 51.389,
  zoom: 11,
};

export function cityCenter(city: string | null | undefined): CityCenter {
  if (city && CITY_CENTERS[city]) return CITY_CENTERS[city];
  return DEFAULT_CENTER;
}

/** Coordinates to render for a listing: exact pin, else the city centroid. */
export function listingCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
  city: string | null | undefined,
): { lat: number; lng: number; exact: boolean } {
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  ) {
    return { lat, lng, exact: true };
  }
  const c = cityCenter(city);
  return { lat: c.lat, lng: c.lng, exact: false };
}

/** External OSM link (always works, even without JS). */
export function osmLink(lat: number, lng: number, zoom = 16): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

export const IRAN_BOUNDS: [[number, number], [number, number]] = [
  [24.5, 43.5],
  [40.5, 64.0],
];
