import { db } from "@/lib/db";
import { jsonError, jsonOk, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/[id] — KYC review / moderation (admin-only, audited). */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (body.kycStatus !== undefined) {
    const v = String(body.kycStatus);
    if (!["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].includes(v))
      return jsonError("وضعیت احراز هویت نامعتبر است.");
    data.kycStatus = v;
  }
  if (body.suspend !== undefined) {
    // moderation: revoke host capability (not account deletion)
    if (Boolean(body.suspend)) data.isHost = false;
  }
  if (Object.keys(data).length === 0) return jsonError("تغییری ارسال نشده است.");

  const user = await db.user.update({ where: { id }, data });
  await db.auditLog.create({
    data: { actorId: auth.user.id, action: "USER_MODERATE", entityType: "User", entityId: id, meta: JSON.stringify(body) },
  });
  return jsonOk({
    user: { id: user.id, name: user.name, kycStatus: user.kycStatus, isHost: user.isHost },
  });
}
