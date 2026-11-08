import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

/**
 * POST /api/reviews — submit a review for a completed rental.
 * Body: { reservationId, rating, comment }
 * Server validates: participant, reservation COMPLETED, one review per pair.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const reservationId = String(body.reservationId ?? "");
  const rating = Math.floor(Number(body.rating));
  const comment = String(body.comment ?? "").trim();

  if (!reservationId) return jsonError("رزرو مشخص نیست.");
  if (!(rating >= 1 && rating <= 5)) return jsonError("امتیاز بین ۱ تا ۵ لازم است.");
  if (comment.length < 5) return jsonError("متن دیدگاه کوتاه است.");

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

  const review = await db.review.create({
    data: {
      listingId: reservation.listingId,
      authorId: user.id,
      reservationId,
      rating,
      comment,
    },
  });

  // Recompute listing aggregates from real data.
  const agg = await db.review.aggregate({
    where: { listingId: reservation.listingId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await db.listing.update({
    where: { id: reservation.listingId },
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
