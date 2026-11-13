import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { normalizeBlockedRangesInput } from "@/lib/jalali";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/listings/[id] */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      owner: {
        select: { id: true, name: true, isHost: true, kycStatus: true, createdAt: true, bio: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!listing) return jsonError("وسیله موردنظر یافت نشد.", 404);
  const user = await getCurrentUser();
  const isOwner = user?.id === listing.ownerId;
  // Hidden/paused listings are only visible to their owner and admins.
  if (listing.status !== "ACTIVE" && !isOwner && !user?.isAdmin) {
    return jsonError("این آگهی در دسترس عمومی نیست.", 404);
  }
  return jsonOk({ listing, isOwner });
}

/** PATCH /api/listings/[id] — owner-only updates (edit fields, pause/resume…). */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return jsonError("وسیله یافت نشد.", 404);
  if (listing.ownerId !== auth.user.id && !auth.user.isAdmin)
    return jsonError("فقط مالک وسیله می‌تواند آن را ویرایش کند.", 403);

  const body = await req.json();
  const data: Record<string, unknown> = {};
  const allowedFields = [
    "title", "description", "brand", "specs", "city", "area", "rules",
  ];
  for (const f of allowedFields) {
    if (body[f] !== undefined) data[f] = String(body[f]);
  }
  for (const f of ["dailyPrice", "weeklyPrice", "deposit", "minDays", "maxDays"]) {
    if (body[f] !== undefined && Number.isFinite(Number(body[f])))
      data[f] = Math.floor(Number(body[f]));
  }
  for (const f of ["pickupInPerson", "deliveryCourier", "instantBook"]) {
    if (body[f] !== undefined) data[f] = Boolean(body[f]);
  }
  if (typeof body.categoryId === "string" && body.categoryId) data.categoryId = body.categoryId;
  // Owner-blocked availability (Jalali calendar in the create-listing wizard).
  if (Array.isArray(body.blockedRanges)) {
    data.blockedRanges = JSON.stringify(normalizeBlockedRangesInput(body.blockedRanges));
  }

  // Status transitions (pause/resume/submit/archive) — validated server-side.
  const STATUS_FLOWS: Record<string, string[]> = {
    DRAFT: ["PENDING", "ARCHIVED"],
    PENDING: ["ACTIVE", "REJECTED", "ARCHIVED"], // ACTIVE only by admin/moderation
    ACTIVE: ["PAUSED", "ARCHIVED"],
    PAUSED: ["ACTIVE", "ARCHIVED"],
    REJECTED: ["PENDING", "ARCHIVED"],
    ARCHIVED: [],
  };
  if (typeof body.status === "string") {
    const next = body.status;
    const isAdmin = auth.user.isAdmin;
    const allowed = STATUS_FLOWS[listing.status] ?? [];
    if (!allowed.includes(next) || (next === "ACTIVE" && listing.status === "PENDING" && !isAdmin)) {
      return jsonError("تغییر وضعیت آگهی مجاز نیست.", 422);
    }
    data.status = next;
    if (next === "ACTIVE" && isAdmin) data.rejectionReason = null;
  }
  if (typeof body.rejectionReason === "string" && auth.user.isAdmin) {
    data.rejectionReason = body.rejectionReason;
  }

  if (Array.isArray(body.images)) {
    await db.listingImage.deleteMany({ where: { listingId: id } });
    const imgs = body.images.slice(0, 8);
    if (imgs.length) {
      await db.listingImage.createMany({
        data: imgs.map((img: string, i: number) => ({
          listingId: id,
          url: String(img).startsWith("/") ? String(img) : `/assets/img/${img}`,
          sortOrder: i,
        })),
      });
    }
  }

  const updated = await db.listing.update({ where: { id }, data, include: { images: true } });
  await db.auditLog.create({
    data: { actorId: auth.user.id, action: "LISTING_UPDATE", entityType: "Listing", entityId: id, meta: JSON.stringify(body) },
  });
  return jsonOk({ listing: updated });
}

/** DELETE /api/listings/[id] — owner-only (soft: archive). */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return jsonError("وسیله یافت نشد.", 404);
  if (listing.ownerId !== auth.user.id && !auth.user.isAdmin)
    return jsonError("فقط مالک وسیله می‌تواند آن را حذف کند.", 403);
  await db.listing.update({ where: { id }, data: { status: "ARCHIVED" } });
  return jsonOk({ ok: true });
}
