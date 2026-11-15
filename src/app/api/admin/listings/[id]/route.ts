import { db } from "@/lib/db";
import { jsonError, jsonOk, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/listings/[id] — full listing moderation (auditable).
 *
 * Supported payloads:
 *  - { decision: "approve" }            → PENDING/REJECTED  ⇒ ACTIVE
 *  - { decision: "reject", reason? }    → PENDING           ⇒ REJECTED
 *  - { action: "pause" }                → ACTIVE            ⇒ PAUSED
 *  - { action: "resume" }               → PAUSED            ⇒ ACTIVE
 *  - { action: "archive" }              → any non-archived  ⇒ ARCHIVED (soft delete)
 *  - { action: "restore" }              → ARCHIVED          ⇒ PENDING
 *  - { action: "delete" }               → hard delete ONLY when the listing has
 *    no reservations/reviews; otherwise it is archived instead (safety rule:
 *    records tied to the rental history / finances are never destroyed).
 *
 * Every call requires a real admin session (requireAdmin) and is written to
 * the AuditLog with the acting admin's id.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const body = await req.json().catch(() => ({}));
  const decision = String(body.decision ?? "");
  const action = String(body.action ?? "");
  const reason = body.reason ? String(body.reason) : null;

  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      _count: { select: { reservations: true, reviews: true } },
    },
  });
  if (!listing) return jsonError("آگهی یافت نشد.", 404);

  /* -------------------- moderation decision (queue flow) ------------------- */
  if (decision === "approve" || decision === "reject") {
    const allowedFrom = decision === "approve" ? ["PENDING", "REJECTED"] : ["PENDING"];
    if (!allowedFrom.includes(listing.status))
      return jsonError(
        `تصمیم «${decision}» برای آگهی با وضعیت فعلی (${listing.status}) قابل اجرا نیست.`,
        422
      );

    const updated = await db.listing.update({
      where: { id },
      data: {
        status: decision === "approve" ? "ACTIVE" : "REJECTED",
        rejectionReason:
          decision === "reject"
            ? (reason ?? "عدم تطابق با قوانین انتشار آگهی")
            : null,
      },
    });

    await db.notification.create({
      data: {
        userId: listing.ownerId,
        type: "LISTING",
        title: decision === "approve" ? "آگهی شما تایید شد" : "آگهی شما رد شد",
        body:
          decision === "approve"
            ? `آگهی «${listing.title}» تایید و منتشر شد.`
            : `آگهی «${listing.title}» رد شد: ${updated.rejectionReason}`,
        link: "/my-items",
      },
    });
    await db.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: `LISTING_${decision.toUpperCase()}`,
        entityType: "Listing",
        entityId: id,
        meta: JSON.stringify({ reason, from: listing.status }),
      },
    });

    return jsonOk({ listing: updated });
  }

  /* ----------------------- lifecycle action switches ----------------------- */
  if (!action) return jsonError("پارامتر decision یا action الزامی است.");

  type Next = { status?: string; rejectionReason?: string | null };
  let next: Next = {};
  let notify: { title: string; body: string } | null = null;

  switch (action) {
    case "pause":
      if (listing.status !== "ACTIVE")
        return jsonError("فقط آگهی منتشرشده قابل توقف است.", 422);
      next = { status: "PAUSED" };
      notify = {
        title: "انتشار آگهی متوقف شد",
        body: `آگهی «${listing.title}» توسط مدیر موقتاً از نمایش عمومی خارج شد.`,
      };
      break;
    case "resume":
      if (listing.status !== "PAUSED")
        return jsonError("فقط آگهی متوقف‌شده قابل انتشار مجدد است.", 422);
      next = { status: "ACTIVE" };
      notify = {
        title: "آگهی شما دوباره منتشر شد",
        body: `آگهی «${listing.title}» به نمایش عمومی برگشت.`,
      };
      break;
    case "archive":
      if (listing.status === "ARCHIVED")
        return jsonOk({ listing, archived: true }); // idempotent
      next = { status: "ARCHIVED" };
      notify = {
        title: "آگهی شما آرشیو شد",
        body: `آگهی «${listing.title}» آرشیو شد و از نمایش عمومی خارج است.`,
      };
      break;
    case "restore":
      if (listing.status !== "ARCHIVED")
        return jsonError("فقط آگهی آرشیوشده قابل بازگردانی است.", 422);
      next = { status: "PENDING" };
      notify = {
        title: "آگهی شما به صف بررسی برگشت",
        body: `آگهی «${listing.title}» برای بررسی مجدد به صف تایید منتقل شد.`,
      };
      break;
    case "delete": {
      // Safety rule: never destroy records tied to rental/financial history.
      if (listing._count.reservations > 0 || listing._count.reviews > 0) {
        const archived =
          listing.status === "ARCHIVED"
            ? listing
            : await db.listing.update({
                where: { id },
                data: { status: "ARCHIVED" },
              });
        await db.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "LISTING_DELETE_FELL_BACK_TO_ARCHIVE",
            entityType: "Listing",
            entityId: id,
            meta: JSON.stringify({
              reservations: listing._count.reservations,
              reviews: listing._count.reviews,
            }),
          },
        });
        return jsonOk({
          listing: archived,
          archived: true,
          message:
            "این آگهی به رزرو/نظرات متصل است؛ به‌جای حذف کامل، آرشیو شد تا سوابق مالی و اجاره حفظ شود.",
        });
      }

      await db.$transaction([
        db.review.deleteMany({ where: { listingId: id } }),
        db.favorite.deleteMany({ where: { listingId: id } }),
        db.conversation.updateMany({ where: { listingId: id }, data: { listingId: null } }),
        db.listingImage.deleteMany({ where: { listingId: id } }),
        db.listing.delete({ where: { id } }),
      ]);
      await db.notification.create({
        data: {
          userId: listing.ownerId,
          type: "LISTING",
          title: "آگهی شما حذف شد",
          body: `آگهی «${listing.title}» توسط مدیر از پلتفرم حذف شد.`,
        },
      });
      await db.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "LISTING_DELETE",
          entityType: "Listing",
          entityId: id,
          meta: JSON.stringify({ title: listing.title, isDemo: listing.isDemo }),
        },
      });
      return jsonOk({ deleted: true });
    }
    default:
      return jsonError("action نامعتبر است.", 422);
  }

  const updated = await db.listing.update({ where: { id }, data: next });
  if (notify) {
    await db.notification.create({
      data: {
        userId: listing.ownerId,
        type: "LISTING",
        title: notify.title,
        body: notify.body,
        link: "/my-items",
      },
    });
  }
  await db.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: `LISTING_${action.toUpperCase()}`,
      entityType: "Listing",
      entityId: id,
      meta: JSON.stringify({ from: listing.status, to: next.status ?? null }),
    },
  });

  return jsonOk({ listing: updated });
}

/** GET /api/admin/listings/[id] — admin-only single listing detail. */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { name: true, slug: true } },
      owner: { select: { id: true, name: true, phone: true, kycStatus: true, isHost: true } },
      _count: { select: { reservations: true, reviews: true, favorites: true } },
    },
  });
  if (!listing) return jsonError("آگهی یافت نشد.", 404);
  return jsonOk({ listing });
}
