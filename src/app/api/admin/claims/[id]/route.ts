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

/** Arbitration verdict on the DEPOSIT (all sandbox-labelled). */
const VERDICTS = ["RELEASE_TO_RENTER", "PARTIAL_DEDUCTION", "PAY_TO_HOST"] as const;
type Verdict = (typeof VERDICTS)[number];

const VERDICT_LABELS: Record<Verdict, string> = {
  RELEASE_TO_RENTER: "آزادسازی کامل ودیعه به نفع مستأجر",
  PARTIAL_DEDUCTION: "کسر بخشی از ودیعه و آزادسازی مابقی",
  PAY_TO_HOST: "پرداخت کامل ودیعه به میزبان",
};

/**
 * PATCH /api/admin/claims/[id] — arbitration decisions.
 * Body: { status, decision?, settlementNote?, appealMessage?,
 *         verdict?: RELEASE_TO_RENTER | PARTIAL_DEDUCTION | PAY_TO_HOST,
 *         chargeAmount?: number }
 *
 * The SETTLED step is where the verdict EXECUTES: the deposit actually moves
 * between the wallet balances (sandbox ledger entries + balance updates in one
 * transaction). It runs at most once per claim (guarded by the claim's
 * settlementNote being empty and the reservation still being DISPUTED).
 * Admin-only, fully audited. The UI must never claim legally binding outcomes.
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

  const verdictRaw = String(body.verdict ?? "");
  const verdict = VERDICTS.includes(verdictRaw as Verdict)
    ? (verdictRaw as Verdict)
    : null;
  const chargeAmountRaw = Math.floor(Number(body.chargeAmount ?? 0));

  /* ---------------------------------------------------- verdict execution */
  if (status === "SETTLED" && verdict && !claim.settlementNote) {
    const reservation = await db.reservation.findUnique({
      where: { id: claim.reservationId },
    });
    if (!reservation) return jsonError("رزرو مرتبط یافت نشد.", 404);
    if (reservation.status !== "DISPUTED")
      return jsonError(
        "این سفارش دیگر در مرحله بررسی اختلاف نیست؛ تسویه دو بار انجام نمی‌شود.",
        409,
      );

    const deposit = reservation.deposit;
    const cashHeld =
      reservation.paymentMethod === "CASH" &&
      reservation.depositStatus === "HELD";
    const promissory = reservation.paymentMethod === "PROMISSORY";
    let charge = 0; // amount that ends up with the HOST (Toman)
    if (verdict === "PAY_TO_HOST") charge = deposit;
    if (verdict === "PARTIAL_DEDUCTION") {
      if (chargeAmountRaw <= 0 || chargeAmountRaw > deposit)
        return jsonError(
          `مبلغ کسر باید بین ۱ و ${deposit.toLocaleString("fa-IR")} تومان (کل ودیعه) باشد.`,
          422,
        );
      charge = chargeAmountRaw;
    }
    const toRenter = deposit - charge;
    const renterDebit = promissory ? charge : 0; // sakteh: renter pays from wallet

    // PROMISSORY with a deduction → the renter never escrowed cash; the note
    // is executed against their wallet balance (never negative).
    if (promissory && charge > 0) {
      const renter = await db.user.findUnique({
        where: { id: reservation.renterId },
        select: { walletBalance: true },
      });
      if (!renter || renter.walletBalance < charge)
        return jsonError(
          "مستأجر با ضمانت سفته ودیعه‌ای نقدی نکرده است و موجودی کیف پولش برای اجرای مبلغ رأی کافی نیست؛ ابتدا شارژ کیف پول مستأجر را پیگیری کنید.",
          402,
        );
    }

    const settlementNote =
      String(body.settlementNote ?? "").trim() ||
      `${VERDICT_LABELS[verdict]}${charge > 0 ? ` — کسر ${charge.toLocaleString("fa-IR")} تومان` : ""} (حالت شبیه‌سازی).`;

    let settleError: Response | null = null;
    const updated = await db.$transaction(async (tx) => {
      const claimUpd = await tx.damageClaim.update({
        where: { id },
        data: { status: "SETTLED", settlementNote, chargeAmount: charge },
      });

      // Ledger + balances (sandbox).
      const entries: {
        userId: string; type: string; amount: number; reference: string; description: string;
      }[] = [];
      if (cashHeld) {
        // The escrowed deposit physically leaves the escrow ledger.
        if (charge > 0)
          entries.push({ userId: reservation.hostId, type: "DISPUTE_SETTLEMENT", amount: charge, reference: reservation.code, description: `دریافت سهم ودیعه طبق رأی داوری (${VERDICT_LABELS[verdict]}) — حالت شبیه‌سازی` });
        if (toRenter > 0)
          entries.push({ userId: reservation.renterId, type: "DEPOSIT_RELEASE", amount: toRenter, reference: reservation.code, description: `آزادسازی ودیعه طبق رأی داوری (${VERDICT_LABELS[verdict]}) — حالت شبیه‌سازی` });
      } else if (promissory && charge > 0) {
        // Nothing was escrowed; the promissory note is executed against the
        // renter's wallet balance (guarded above).
        entries.push({ userId: reservation.renterId, type: "DISPUTE_CHARGE", amount: -charge, reference: reservation.code, description: `اجرای سفته الکترونیک طبق رأی داوری (${VERDICT_LABELS[verdict]}) — حالت شبیه‌سازی` });
        entries.push({ userId: reservation.hostId, type: "DISPUTE_SETTLEMENT", amount: charge, reference: reservation.code, description: `دریافت خسارت طبق رأی داوری (اجرای سفته) — حالت شبیه‌سازی` });
      }

      const balanceDelta: Record<string, number> = {};
      for (const w of entries) {
        await tx.walletTransaction.create({ data: { ...w, status: "COMPLETED" } });
        balanceDelta[w.userId] = (balanceDelta[w.userId] ?? 0) + w.amount;
      }
      for (const [userId, delta] of Object.entries(balanceDelta)) {
        if (delta < 0) {
          const debited = await tx.user.updateMany({
            where: { id: userId, walletBalance: { gte: Math.abs(delta) } },
            data: { walletBalance: { decrement: Math.abs(delta) } },
          });
          if (debited.count !== 1) {
            settleError = jsonError(
              "موجودی کیف پول مستأجر برای اجرای رأی کافی نیست.",
              402,
            );
            throw new Error("WALLET_INSUFFICIENT_BALANCE");
          }
        } else if (delta > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: delta } },
          });
        }
      }

      // Close the reservation out: the dispute is decided, the deposit is
      // settled — the order completes with a verdict event on its timeline.
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "COMPLETED",
          depositStatus: cashHeld ? "REFUNDED" : reservation.depositStatus,
          events: {
            create: {
              actor: "admin",
              type: "RELEASE_DEPOSIT",
              message: `رأی داوری اجرا شد: ${VERDICT_LABELS[verdict]}${charge > 0 ? ` (کسر ${charge.toLocaleString("fa-IR")} تومان از ودیعه)` : ""} — پرونده: ${claim.title}`,
            },
          },
        },
      });

      await tx.notification.create({
        data: { userId: reservation.renterId, type: "DISPUTE", title: "رأی داوری صادر و اجرا شد", body: `پروندهٔ «${claim.title}»: ${VERDICT_LABELS[verdict]}. جزئیات در صفحهٔ پرونده و روند اجاره.`, link: "/damage-claims" },
      });
      await tx.notification.create({
        data: { userId: reservation.hostId, type: "DISPUTE", title: "رأی داوری صادر و اجرا شد", body: `پروندهٔ «${claim.title}»: ${VERDICT_LABELS[verdict]}. جزئیات در صفحهٔ پرونده و روند اجاره.`, link: "/damage-claims" },
      });

      return claimUpd;
    }).catch((e: unknown) => {
      if (settleError) return settleError;
      throw e;
    });

    if (updated instanceof Response) return updated;

    await db.auditLog.create({
      data: { actorId: auth.user.id, action: `CLAIM_${status}`, entityType: "DamageClaim", entityId: id, meta: JSON.stringify({ ...body, executedVerdict: verdict, charge }) },
    });
    return jsonOk({ claim: updated });
  }

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
