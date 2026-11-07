import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { daysBetween } from "@/lib/format";

/**
 * GET /api/reservations — the caller's reservations (as renter and as host).
 */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const reservations = await db.reservation.findMany({
    where: { OR: [{ renterId: user.id }, { hostId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
      renter: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  return jsonOk({ reservations });
}

/**
 * POST /api/reservations — create a rental request.
 * Body: { listingId, startDate, endDate, pickupMethod?, renterNote? }
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  try {
    const body = await req.json();
    const listingId = String(body.listingId ?? "");
    const listing = await db.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "ACTIVE")
      return jsonError("این وسیله در حال حاضر قابل اجاره نیست.", 404);
    if (listing.ownerId === user.id)
      return jsonError("نمی‌توانید وسیله خودتان را اجاره کنید.", 422);

    const start = new Date(String(body.startDate ?? ""));
    const end = new Date(String(body.endDate ?? ""));
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return jsonError("تاریخ تحویل و بازگشت را انتخاب کنید.");
    if (start.getTime() < Date.now() - 86400000)
      return jsonError("تاریخ تحویل نمی‌تواند در گذشته باشد.");
    if (end <= start)
      return jsonError("تاریخ بازگشت باید بعد از تاریخ تحویل باشد.");

    const days = daysBetween(start, end);
    if (days < listing.minDays)
      return jsonError(`حداقل مدت اجاره ${listing.minDays} روز است.`);
    if (days > listing.maxDays)
      return jsonError(`حداکثر مدت اجاره ${listing.maxDays} روز است.`);

    // Availability conflict check against overlapping non-cancelled reservations.
    const overlap = await db.reservation.findFirst({
      where: {
        listingId,
        status: { notIn: ["CANCELLED", "REJECTED"] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });
    if (overlap)
      return jsonError("این بازه با اجاره دیگری هم‌پوشانی دارد؛ بازه دیگری انتخاب کنید.", 409);

    const subtotal = listing.dailyPrice * days;
    const { generateReferenceCode } = await import("@/lib/rental-state");
    const reservation = await db.reservation.create({
      data: {
        code: generateReferenceCode(),
        listingId,
        renterId: user.id,
        hostId: listing.ownerId,
        startDate: start,
        endDate: end,
        days,
        dailyPrice: listing.dailyPrice,
        subtotal,
        deposit: listing.deposit,
        total: subtotal + listing.deposit,
        pickupMethod: body.pickupMethod === "COURIER" && listing.deliveryCourier
          ? "COURIER" : "PICKUP",
        renterNote: body.renterNote ? String(body.renterNote) : null,
        status: "REQUESTED",
        events: {
          create: {
            actor: "renter",
            type: "REQUEST",
            message: `درخواست اجاره برای ${days} روز ثبت شد.`,
          },
        },
      },
    });

    await db.notification.create({
      data: {
        userId: listing.ownerId,
        type: "RESERVATION",
        title: "درخواست اجاره جدید",
        body: `${user.name} برای «${listing.title}» درخواست ثبت کرد.`,
        link: "/host-dashboard",
      },
    });
    await db.auditLog.create({
      data: { actorId: user.id, action: "RESERVATION_CREATE", entityType: "Reservation", entityId: reservation.id, meta: JSON.stringify({ code: reservation.code }) },
    });

    return jsonOk({ reservation }, 201);
  } catch {
    return jsonError("خطای غیرمنتظره در ثبت درخواست اجاره.", 500);
  }
}
