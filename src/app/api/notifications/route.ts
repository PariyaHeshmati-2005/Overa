import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { maybeRunRentalReminderSweep } from "@/lib/rental-reminders";

/** GET /api/notifications — my notifications. The bell/notifications page
 *  polls this endpoint, so it opportunistically drives the date-aware
 *  rental reminder sweep (delivery day + return deadline, throttled). */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  await maybeRunRentalReminderSweep();
  const notifications = await db.notification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ notifications });
}

/** POST /api/notifications — { id? } mark one or all read. */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  if (body.id) {
    await db.notification.updateMany({
      where: { id: String(body.id), userId: auth.user.id },
      data: { read: true },
    });
  } else {
    await db.notification.updateMany({
      where: { userId: auth.user.id, read: false },
      data: { read: true },
    });
  }
  return jsonOk({ ok: true });
}

/** DELETE /api/notifications — { id } deletes ONE of my notifications,
 *  { all: true } clears them all. The trash icon on the notifications page
 *  calls this; ownership is enforced inside the where clause, so a user can
 *  never delete someone else's notification and the table stays lean. */
export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => ({}));
  if (body.all) {
    const { count } = await db.notification.deleteMany({
      where: { userId: auth.user.id },
    });
    return jsonOk({ ok: true, deleted: count });
  }
  if (body.id) {
    const { count } = await db.notification.deleteMany({
      where: { id: String(body.id), userId: auth.user.id },
    });
    if (count === 0)
      return jsonError("اعلان یافت نشد یا متعلق به شما نیست.", 404);
    return jsonOk({ ok: true, deleted: count });
  }
  return jsonError("شناسه اعلان (id) یا all مشخص نشده است.", 422);
}
