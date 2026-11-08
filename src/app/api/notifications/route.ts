import { db } from "@/lib/db";
import { jsonOk, requireUser } from "@/lib/api";

/** GET /api/notifications — my notifications. */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
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
