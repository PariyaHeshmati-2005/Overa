import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { notifyAdmins, type NotifyDb } from "@/lib/admin-notify";

/** GET /api/claims — caller's claims (as claimant or respondent), admins see all. */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const claims = await db.damageClaim.findMany({
    where: user.isAdmin
      ? {}
      : { OR: [{ claimantId: user.id }, { againstId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      reservation: { include: { listing: { select: { title: true, images: { take: 1 } } } } },
      claimant: { select: { id: true, name: true } },
      against: { select: { id: true, name: true } },
    },
  });
  return jsonOk({ claims });
}

/**
 * POST /api/claims — open a damage claim on a reservation.
 * Body: { reservationId, title, description, evidenceUrls? }
 *
 * Stage detection (DamageClaim.stage):
 *  - RENTER at DELIVERED  → stage "DELIVERY": the renter declares the damage
 *    («اعلام خسارت و تحویل کالا») AND STILL RECEIVES the item — the order
 *    STAYS in DELIVERED so the OTP delivery flow can complete; the claim is
 *    recorded and visible in the renter, host and admin panels.
 *  - At RETURN_REQUESTED/RETURNED (usually the HOST at the return stage)
 *    → stage "RETURN": the order goes to DISPUTED and the arbitration panel
 *    reads BOTH descriptions (renter's delivery-stage + host's return-stage)
 *    before issuing the verdict.
 *  - Any other stage → "GENERAL" (mid-rental disputes → DISPUTED as before).
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const reservationId = String(body.reservationId ?? "");
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();

  if (!reservationId) return jsonError("رزرو مشخص نیست.");
  if (title.length < 4) return jsonError("عنوان اعلام خسارت کوتاه است.");
  if (description.length < 20) return jsonError("شرح خسارت باید حداقل ۲۰ کاراکتر باشد.");

  const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) return jsonError("رزرو یافت نشد.", 404);
  if (reservation.renterId !== user.id && reservation.hostId !== user.id)
    return jsonError("فقط طرفین اجاره می‌توانند خسارت اعلام کنند.", 403);

  const evidence = Array.isArray(body.evidenceUrls)
    ? body.evidenceUrls.slice(0, 6).map(String)
    : [];

  const isRenterClaimant = reservation.renterId === user.id;
  const isDeliveryStage = isRenterClaimant && reservation.status === "DELIVERED";
  const isReturnStage =
    reservation.status === "RETURN_REQUESTED" || reservation.status === "RETURNED";
  const stage = isDeliveryStage ? "DELIVERY" : isReturnStage ? "RETURN" : "GENERAL";

  const claim = await db.damageClaim.create({
    data: {
      reservationId,
      claimantId: user.id,
      againstId: isRenterClaimant ? reservation.hostId : reservation.renterId,
      title,
      description,
      evidenceUrls: JSON.stringify(evidence),
      status: "OPEN",
      stage,
    },
  });

  // Delivery-stage declaration: the renter declared the damage but KEEPS the
  // item — the order must stay in DELIVERED so the one-time-code delivery
  // confirmation (→ RENTAL_ACTIVE) can still happen. No DISPUTED jump here.
  // For every other stage, DISPUTED is applied only while the state machine
  // still allows a dispute (terminal orders keep their status).
  const DISPUTABLE_STATUSES = [
    "PAID",
    "DELIVERED",
    "RENTAL_ACTIVE",
    "RETURN_REQUESTED",
    "RETURNED",
    "INSPECTION",
  ];
  if (!isDeliveryStage && DISPUTABLE_STATUSES.includes(reservation.status)) {
    await db.reservation.update({
      where: { id: reservationId },
      data: { status: "DISPUTED", disputeOpenedAt: new Date() },
    });
  }
  await db.reservationEvent.create({
    data: {
      reservationId,
      actor: isRenterClaimant ? "renter" : "host",
      type: "DISPUTE",
      message: isDeliveryStage
        ? `اعلام خسارت در مرحله تحویل («اعلام خسارت و تحویل کالا») ثبت شد: ${title} — مستأجر با وجود اعلام خسارت، کالا را تحویل می‌گیرد و فرآیند تحویل ادامه می‌یابد؛ شرح در پنل مستأجر، میزبان و مدیریت قابل مشاهده است.`
        : `اعلام خسارت: ${title}`,
    },
  });

  await db.notification.create({
    data: {
      userId: claim.againstId,
      type: "DISPUTE",
      title: isDeliveryStage ? "اعلام خسارت در مرحله تحویل" : "اعلام خسارت جدید",
      body: isDeliveryStage
        ? `${user.name} برای اجارهٔ «${reservation.code}» هنگام تحویل خسارت اعلام کرد و کالا را تحویل می‌گیرد؛ شرح خسارت در پروندهٔ «خسارت و داوری» قابل مشاهده است.`
        : `${user.name} برای اجاره «${reservation.code}» خسارت اعلام کرد.`,
      link: "/damage-claims",
    },
  });
  // Oversight: the admin panel must show every declaration (with the
  // description and the goods-received status) the moment it is filed.
  await notifyAdmins(
    db as unknown as NotifyDb,
    {
      type: "DISPUTE",
      title: isDeliveryStage ? "اعلام خسارت در مرحله تحویل (کالا تحویل گرفته شد)" : "اعلام خسارت جدید برای یک سفارش",
      body: isDeliveryStage
        ? `برای سفارش «${reservation.code}» مستأجر هنگام تحویل خسارت اعلام کرد و کالا را تحویل گرفت؛ شرح در پنل داوری قابل بررسی است.`
        : `برای سفارش «${reservation.code}» خسارت اعلام شد؛ جزئیات در پنل داوری قابل بررسی است.`,
      link: "/arbitration-panel",
    },
    [reservation.renterId, reservation.hostId],
  );
  await db.auditLog.create({
    data: { actorId: user.id, action: "CLAIM_CREATE", entityType: "DamageClaim", entityId: claim.id },
  });

  return jsonOk({ claim, deliveryStage: isDeliveryStage }, 201);
}
