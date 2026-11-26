import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

/**
 * POST /api/reviews — submit a review, from either entry point:
 *   1. Body { reservationId, rating, comment } — a VERIFIED review tied to a
 *      completed rental (participant only, one review per pair). Shows with
 *      the «اجاره‌کننده‌ی تأییدشده» badge on the item page.
 *   2. Body { listingId, rating, comment } — a direct review written on the
 *      item-details page (any signed-in user except the owner, one review per
 *      user per listing).
 * Both paths recompute the listing's real rating aggregate.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const reservationId = body.reservationId ? String(body.reservationId) : "";
  const listingId = body.listingId ? String(body.listingId) : "";
  const rating = Math.floor(Number(body.rating));
  const comment = String(body.comment ?? "").trim();

  if (!reservationId && !listingId)
    return jsonError("رزرو یا وسیله مشخص نیست.");
  if (!(rating >= 1 && rating <= 5)) return jsonError("امتیاز بین ۱ تا ۵ لازم است.");
  if (comment.length < 5) return jsonError("متن دیدگاه کوتاه است.");
  if (comment.length > 2000)
    return jsonError("متن دیدگاه بیش از حد طولانی است (حداکثر ۲۰۰۰ کاراکتر).");

  let targetListingId = "";

  if (reservationId) {
    // ---- Verified path: tied to a completed rental -----------------------
    const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) return jsonError("رزرو یافت نشد.", 404);
    if (reservation.renterId !== user.id && reservation.hostId !== user.id)
      return jsonError("فقط طرفین اجاره می‌توانند دیدگاه ثبت کنند.", 403);
    if (reservation.status !== "COMPLETED")
      return jsonError("ثبت دیدگاه پس از تکمیل اجاره امکان‌پذیر است.", 422);

    const existing = await db.review.findFirst({
      where: { reservationId, authorId: user.id },
    });
    if (existing) return jsonError("برای این اجاره قبلاً دیدگاه ثبت کرده‌اید.", 409);

    targetListingId = reservation.listingId;
    const review = await db.review.create({
      data: {
        listingId: targetListingId,
        authorId: user.id,
        reservationId,
        rating,
        comment,
      },
    });

    // Recompute listing aggregates from real data.
    const agg = await db.review.aggregate({
      where: { listingId: targetListingId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await db.listing.update({
      where: { id: targetListingId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewsCount: agg._count.rating,
      },
    });

    const otherId = reservation.renterId === user.id ? reservation.hostId : reservation.renterId;
    await db.notification.create({
      data: { userId: otherId, type: "REVIEW", title: "دیدگاه جدید", body: `${user.name} برای اجاره «${reservation.code}» دیدگاه ثبت کرد.`, link: "/reviews" },
    });

    return jsonOk({ review }, 201);
  }

  // ---- Direct path: review written on the item-details page ---------------
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true, status: true, title: true },
  });
  if (!listing) return jsonError("وسیله یافت نشد.", 404);
  if (listing.ownerId === user.id)
    return jsonError("برای وسیله خودتان نمی‌توانید دیدگاه ثبت کنید.", 422);
  if (listing.status !== "ACTIVE" && !user.isAdmin)
    return jsonError("این وسیله در حال حاضر قابل دیدگاه‌گذاری نیست.", 422);

  const existing = await db.review.findFirst({
    where: { listingId, authorId: user.id, reservationId: null },
  });
  if (existing)
    return jsonError("شما قبلاً برای این وسیله دیدگاه ثبت کرده‌اید.", 409);

  targetListingId = listing.id;
  const review = await db.review.create({
    data: {
      listingId: targetListingId,
      authorId: user.id,
      rating,
      comment,
    },
  });

  const agg = await db.review.aggregate({
    where: { listingId: targetListingId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await db.listing.update({
    where: { id: targetListingId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewsCount: agg._count.rating,
    },
  });

  await db.notification.create({
    data: { userId: listing.ownerId, type: "REVIEW", title: "دیدگاه جدید", body: `${user.name} برای «${listing.title}» دیدگاه ثبت کرد.`, link: "/reviews" },
  });

  return jsonOk({ review }, 201);
}
