import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

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

  const claim = await db.damageClaim.create({
    data: {
      reservationId,
      claimantId: user.id,
      againstId: reservation.renterId === user.id ? reservation.hostId : reservation.renterId,
      title,
      description,
      evidenceUrls: JSON.stringify(evidence),
      status: "OPEN",
    },
  });

  // Move the reservation into DISPUTED via the state machine.
  await db.reservation.update({ where: { id: reservationId }, data: { status: "DISPUTED" } });
  await db.reservationEvent.create({
    data: { reservationId, actor: user.id === reservation.renterId ? "renter" : "host", type: "DISPUTE", message: `اعلام خسارت: ${title}` },
  });

  await db.notification.create({
    data: { userId: claim.againstId, type: "DISPUTE", title: "اعلام خسارت جدید", body: `${user.name} برای اجاره «${reservation.code}» خسارت اعلام کرد.`, link: "/damage-claims" },
  });
  await db.auditLog.create({
    data: { actorId: user.id, action: "CLAIM_CREATE", entityType: "DamageClaim", entityId: claim.id },
  });

  return jsonOk({ claim }, 201);
}
