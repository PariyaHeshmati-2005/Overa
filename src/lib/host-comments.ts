import { db } from "@/lib/db";

/**
 * Automatic rental comments (نظرات میزبان) written by the platform on the
 * HOST's listing reviews section:
 *
 *  - FAILED rental (renter pressed «عدم تحویل و اعلام خسارت» at the delivery
 *    stage): a 1-star comment whose text carries the host's cumulative failed
 *    counter — «یک اجاره ناموفق …»، «دو اجاره ناموفق …» — so every new
 *    failure adds the grown number to the reviews section.
 *  - SUCCESSFUL rental (host pressed «تحویل سالم گرفتم» at the return stage):
 *    a 5-star comment carrying the host's cumulative successful counter and
 *    noting the automatic deposit release to the renter's wallet.
 *
 * The comment is authored by the other party of the reservation (the renter)
 * and is tied to the reservation, exactly like a verified review. Listing
 * rating aggregates (rating / reviewsCount) are recomputed from real data.
 */
export async function createHostAutoComment(params: {
  listingId: string;
  authorId: string;
  reservationId: string;
  rating: number;
  comment: string;
  hostId: string;
  reservationCode: string;
  title: string;
}) {
  const review = await db.review.create({
    data: {
      listingId: params.listingId,
      authorId: params.authorId,
      reservationId: params.reservationId,
      rating: params.rating,
      comment: params.comment,
    },
  });

  // Recompute listing aggregates from real data (same as POST /api/reviews).
  const agg = await db.review.aggregate({
    where: { listingId: params.listingId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await db.listing.update({
    where: { id: params.listingId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewsCount: agg._count.rating,
    },
  });

  await db.notification.create({
    data: {
      userId: params.hostId,
      type: "REVIEW",
      title: params.title,
      body: `ثبت خودکار در نظرات «${params.reservationCode}»: ${params.comment}`,
      link: "/reviews",
    },
  });

  return review;
}
