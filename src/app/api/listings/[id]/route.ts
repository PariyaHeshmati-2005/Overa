import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { normalizeBlockedRangesInput } from "@/lib/jalali";
import { buildListingSearchKey } from "@/lib/persian";

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
  // Optional exact map coordinates (wizard location picker).
  const toCoord = (value: unknown, min: number, max: number): number | null => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return Math.round(n * 1e6) / 1e6;
  };
  if (body.lat !== undefined) data.lat = toCoord(body.lat, -90, 90);
  if (body.lng !== undefined) data.lng = toCoord(body.lng, -180, 180);
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

  // ---- Image validation (server-side, BEFORE any database write) ----
  // Mirrors the wizard's frontend rule so direct API calls cannot bypass it:
  // usable images only (non-empty strings), max 8 — same cap as creation.
  const submittedImages = Array.isArray(body.images)
    ? body.images
        .map((img: unknown) => String(img).trim())
        .filter((img: string) => img.length > 0)
        .slice(0, 8)
    : null;
  // Effective status AFTER this request (the transition was validated above).
  const nextStatus =
    typeof data.status === "string" ? data.status : listing.status;
  // "Final" = everything but an unsaved DRAFT (submitted for moderation once).
  const isFinal = nextStatus !== "DRAFT";

  if (isFinal && submittedImages !== null && submittedImages.length < 1) {
    // A submitted listing can never end up without images.
    return jsonError(
      nextStatus === "PENDING"
        ? "برای ثبت نهایی/ارسال به بررسی مدیریت، حداقل یک تصویر معتبر الزامی است."
        : "حذف تمام تصاویر آگهی ثبت‌شده مجاز نیست؛ حداقل یک تصویر باید باقی بماند.",
      400,
    );
  }
  if (nextStatus === "PENDING" && submittedImages === null) {
    // Submitting for review without touching images: the listing must already
    // carry at least one image — checked WITHOUT modifying anything.
    const imageCount = await db.listingImage.count({ where: { listingId: id } });
    if (imageCount < 1) {
      return jsonError(
        "برای ارسال آگهی به بررسی مدیریت، حداقل یک تصویر الزامی است؛ ابتدا تصویر اضافه کنید.",
        400,
      );
    }
  }

  // All validations passed — persist field changes and (optionally) replace
  // the images atomically; the previous images are deleted only here, never
  // before validation.
  const updated = await db.$transaction(async (tx) => {
    if (submittedImages !== null) {
      await tx.listingImage.deleteMany({ where: { listingId: id } });
      if (submittedImages.length) {
        await tx.listingImage.createMany({
          data: submittedImages.map((img: string, i: number) => ({
            listingId: id,
            url: img.startsWith("/") ? img : `/assets/img/${img}`,
            sortOrder: i,
          })),
        });
      }
    }
    return tx.listing.update({ where: { id }, data, include: { images: true } });
  });

  // Keep the normalized search key in sync with editable text fields.
  if (Object.keys(data).some((k) =>
    ["title", "description", "brand", "specs", "city", "categoryId"].includes(k)
  )) {
    const fresh = await db.listing.findUnique({
      where: { id },
      select: {
        title: true, brand: true, specs: true, description: true, city: true,
        category: { select: { name: true } },
      },
    });
    if (fresh) {
      await db.listing.update({
        where: { id },
        data: {
          searchKey: buildListingSearchKey({
            title: fresh.title,
            brand: fresh.brand,
            specs: fresh.specs,
            description: fresh.description,
            city: fresh.city,
            categoryName: fresh.category?.name ?? null,
          }),
        },
      });
    }
  }

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
