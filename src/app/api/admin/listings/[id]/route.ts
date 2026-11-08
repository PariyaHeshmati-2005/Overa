import { db } from "@/lib/db";
import { jsonError, jsonOk, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/listings/[id] — moderation: approve/reject (auditable). */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const body = await req.json().catch(() => ({}));
  const decision = String(body.decision ?? "");
  const reason = body.reason ? String(body.reason) : null;

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return jsonError("آگهی یافت نشد.", 404);
  if (listing.status !== "PENDING")
    return jsonError("فقط آگهی‌های در انتظار بررسی قابل تصمیم‌گیری هستند.", 422);

  if (decision !== "approve" && decision !== "reject")
    return jsonError("تصمیم باید approve یا reject باشد.");

  const updated = await db.listing.update({
    where: { id },
    data: {
      status: decision === "approve" ? "ACTIVE" : "REJECTED",
      rejectionReason: decision === "reject" ? (reason ?? "عدم تطابق با قوانین انتشار آگهی") : null,
    },
  });

  await db.notification.create({
    data: {
      userId: listing.ownerId, type: "LISTING",
      title: decision === "approve" ? "آگهی شما تایید شد" : "آگهی شما رد شد",
      body: decision === "approve"
        ? `آگهی «${listing.title}» تایید و منتشر شد.`
        : `آگهی «${listing.title}» رد شد: ${updated.rejectionReason}`,
      link: "/my-items",
    },
  });
  await db.auditLog.create({
    data: { actorId: auth.user.id, action: `LISTING_${decision.toUpperCase()}`, entityType: "Listing", entityId: id, meta: JSON.stringify({ reason }) },
  });

  return jsonOk({ listing: updated });
}
