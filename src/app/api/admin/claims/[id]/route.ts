import { db } from "@/lib/db";
import { jsonError, jsonOk, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const CLAIM_STATUS_FLOWS: Record<string, string[]> = {
  OPEN: ["COUNTER_EVIDENCE", "UNDER_REVIEW", "REJECTED"],
  COUNTER_EVIDENCE: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["DECIDED"],
  DECIDED: ["APPEALED", "SETTLED"],
  APPEALED: ["UNDER_REVIEW", "SETTLED"],
  REJECTED: [],
  SETTLED: [],
};

/**
 * PATCH /api/admin/claims/[id] — arbitration decisions.
 * Body: { status, decision?, settlementNote? }
 * Admin-only, auditable. The UI must never claim legally binding outcomes.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "");
  const claim = await db.damageClaim.findUnique({ where: { id } });
  if (!claim) return jsonError("پرونده یافت نشد.", 404);

  const allowed = CLAIM_STATUS_FLOWS[claim.status] ?? [];
  if (!allowed.includes(status))
    return jsonError("تغییر وضعیت پرونده مجاز نیست.", 422);

  const updated = await db.damageClaim.update({
    where: { id },
    data: {
      status,
      decision: status === "DECIDED" ? String(body.decision ?? "تصمیم کارشناس ثبت شد.") : claim.decision,
      decidedAt: status === "DECIDED" ? new Date() : claim.decidedAt,
      appealMessage: status === "APPEALED" ? String(body.appealMessage ?? null) || claim.appealMessage : claim.appealMessage,
      settlementNote: status === "SETTLED" ? String(body.settlementNote ?? "توافق و تسویه ثبت شد (شبیه‌سازی).") : claim.settlementNote,
    },
  });

  await db.auditLog.create({
    data: { actorId: auth.user.id, action: `CLAIM_${status}`, entityType: "DamageClaim", entityId: id, meta: JSON.stringify(body) },
  });

  const notifyUserId = claim.againstId;
  await db.notification.create({
    data: { userId: notifyUserId, type: "DISPUTE", title: "به‌روزرسانی پرونده خسارت", body: `وضعیت پرونده «${claim.title}» به ${status} تغییر کرد.`, link: "/damage-claims" },
  });

  return jsonOk({ claim: updated });
}
