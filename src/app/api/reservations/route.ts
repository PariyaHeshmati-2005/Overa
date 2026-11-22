import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { maybeRunRentalReminderSweep } from "@/lib/rental-reminders";
import {
  diffDaysIso,
  parseBlockedRanges,
  rangeHitsBooked,
  todayIsoTehran,
} from "@/lib/jalali";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize a client-supplied calendar date into an exact UTC-midnight Date.
 * Accepts "YYYY-MM-DD" (or any ISO string whose date part we slice); the
 * stored instant is always midnight UTC of the PICKED calendar day, so the
 * delivery/return day never drifts by a day across timezones.
 */
function toUtcMidnight(value: unknown): Date | null {
  const raw = String(value ?? "").slice(0, 10);
  if (!ISO_DATE_RE.test(raw)) return null;
  return new Date(`${raw}T00:00:00.000Z`);
}

/**
 * GET /api/reservations — the caller's reservations (as renter and as host).
 * The rentals page polls this endpoint, so it opportunistically drives the
 * date-aware rental reminder sweep (delivery day + return deadline,
 * throttled to at most one run per minute per server process).
 */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;
  await maybeRunRentalReminderSweep();

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

    const start = toUtcMidnight(body.startDate);
    const end = toUtcMidnight(body.endDate);
    if (!start || !end)
      return jsonError("تاریخ تحویل و بازگشت را از تقویم شمسی انتخاب کنید.");
    // Calendar-date comparisons are done on the ISO day strings (Tehran
    // "today"), never on raw timestamps — the picked delivery day is stored
    // exactly as picked, and the return day is the day after the last rented day.
    const startIso = String(body.startDate).slice(0, 10);
    const endIso = String(body.endDate).slice(0, 10);
    if (startIso < todayIsoTehran())
      return jsonError("تاریخ تحویل نمی‌تواند در گذشته باشد.");
    if (endIso <= startIso)
      return jsonError("تاریخ بازگشت باید بعد از تاریخ تحویل باشد.");

    const days = diffDaysIso(startIso, endIso); // nights-based, same as the calendar
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

    // Owner-blocked days (picked by the host in the create-listing wizard).
    const blocked = parseBlockedRanges(listing.blockedRanges);
    if (blocked.length && rangeHitsBooked(startIso, endIso, blocked)) {
      return jsonError("برخی روزهای این بازه توسط میزبان مسدود شده است؛ بازه دیگری انتخاب کنید.", 422);
    }

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
