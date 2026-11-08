import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/reviews/[id]/reply — host reply to a review on their own listing.
 * Body: { reply: string }
 * Server checks the session user owns the review's listing; one reply per
 * review, editable (hostReply + hostReplyAt are overwritten).
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const review = await db.review.findUnique({
    where: { id },
    include: { listing: { select: { id: true, ownerId: true, title: true } } },
  });
  if (!review) return jsonError("دیدگاه یافت نشد.", 404);
  if (review.listing.ownerId !== user.id)
    return jsonError("فقط میزبان وسیله می‌تواند به این دیدگاه پاسخ دهد.", 403);

  const body = await req.json().catch(() => ({}));
  const reply = String(body.reply ?? "").trim();
  if (reply.length < 2) return jsonError("متن پاسخ کوتاه است.");
  if (reply.length > 1000) return jsonError("متن پاسخ حداکثر ۱۰۰۰ کاراکتر است.");

  const updated = await db.review.update({
    where: { id },
    data: {
      hostReply: reply,
      hostReplyAt: new Date(),
      hostReplyUserId: user.id,
    },
  });

  // Notify the review author (best-effort, sandbox labelling not required here)
  await db.notification
    .create({
      data: {
        userId: review.authorId,
        type: "REVIEW",
        title: "پاسخ میزبان به دیدگاه شما",
        body: `میزبان «${review.listing.title}» به دیدگاه شما پاسخ داد.`,
        link: "/reviews",
      },
    })
    .catch(() => {});

  return jsonOk({ review: updated });
}
