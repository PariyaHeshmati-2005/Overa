import { db } from "@/lib/db";
import { jsonOk, jsonError, requireUser } from "@/lib/api";

/**
 * Favorites — persisted per user in the `Favorite` table (unique per
 * user+listing). Guests get 401; the item-details heart button and the
 * /favorites page both talk to this route.
 */

/** Shared shape for the /favorites page grid (first image included). */
function toFavoriteRow(f: {
  id: string;
  createdAt: Date;
  listing: {
    id: string;
    title: string;
    city: string;
    area: string | null;
    dailyPrice: number;
    rating: number;
    reviewsCount: number;
    instantBook: boolean;
    status: string;
    images: { url: string; alt: string | null }[];
  };
}) {
  return {
    id: f.id,
    createdAt: f.createdAt.toISOString(),
    listing: {
      id: f.listing.id,
      title: f.listing.title,
      city: f.listing.city,
      area: f.listing.area,
      dailyPrice: f.listing.dailyPrice,
      rating: f.listing.rating,
      reviewsCount: f.listing.reviewsCount,
      instantBook: f.listing.instantBook,
      status: f.listing.status,
      imageUrl: f.listing.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg",
      imageAlt: f.listing.images[0]?.alt ?? null,
    },
  };
}

const LISTING_INCLUDE = {
  listing: {
    select: {
      id: true,
      title: true,
      city: true,
      area: true,
      dailyPrice: true,
      rating: true,
      reviewsCount: true,
      instantBook: true,
      status: true,
      images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
    },
  },
};

/** GET /api/favorites — my favorites, newest first. */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const favorites = await db.favorite.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    include: LISTING_INCLUDE,
  });
  return jsonOk({ favorites: favorites.map(toFavoriteRow) });
}

/** POST /api/favorites — { listingId } add (idempotent). */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  const listingId = typeof body?.listingId === "string" ? body.listingId : "";
  if (!listingId) return jsonError("شناسه وسیله نامعتبر است.", 400);

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) return jsonError("این وسیله پیدا نشد.", 404);

  // upsert semantics: re-favoriting is never an error (idempotent toggle UX)
  const existing = await db.favorite.findUnique({
    where: { userId_listingId: { userId: auth.user.id, listingId } },
    select: { id: true },
  });
  if (existing) return jsonOk({ faved: true });
  await db.favorite.create({ data: { userId: auth.user.id, listingId } });
  return jsonOk({ faved: true });
}

/** DELETE /api/favorites — { listingId } remove (idempotent). */
export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  const listingId = typeof body?.listingId === "string" ? body.listingId : "";
  if (!listingId) return jsonError("شناسه وسیله نامعتبر است.", 400);

  await db.favorite.deleteMany({
    where: { userId: auth.user.id, listingId },
  });
  return jsonOk({ faved: false });
}
