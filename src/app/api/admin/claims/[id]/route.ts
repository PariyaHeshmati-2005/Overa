import { db } from "@/lib/db";
import { jsonError, jsonOk, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Status flow of the «اعلام خسارت‌ها» queue: the admin reviews the case
 * (optionally via the case chat with the renter), then issues the ruling and
 * closes the case in one step. Legacy rows (COUNTER_EVIDENCE / DECIDED /
 * APPEALED) can still be settled. REJECTED / SETTLED are terminal.
 */
const CLAIM_STATUS_FLOWS: Record<string, string[]> = {
  OPEN: ["UNDER_REVIEW", "SETTLED"],
  COUNTER_EVIDENCE: ["UNDER_REVIEW", "SETTLED"],
  UNDER_REVIEW: ["SETTLED"],
  DECIDED: ["SETTLED"],
  APPEALED: ["UNDER_REVIEW", "SETTLED"],
  REJECTED: [],
  SETTLED: [],
};

/**
 * PATCH /api/admin/claims/[id] — damage-claim handling (admin only).
 * Body: { status, decision?, percentToRenter? }
 *
 * The SETTLED step is where the RULING EXECUTES («صدور رأی و اختتامیه»): the
 * admin rules what PERCENT of the deposit is released to the renter — the
 * remainder goes to the host's wallet — and the wallet balances move in one
 * transaction (sandbox ledger, guarded against negative balances). It runs at
 * most once per claim (guarded by the reservation still being DISPUTED).
 * The ruling is expected within ONE WEEK of the declaration — the deadline is
 * surfaced in the admin UI; the API itself never blocks a late ruling so a
 * deposit can never be stranded.
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

  /* ---------------------------------------------------- ruling execution */
  if (status === "SETTLED") {
    const reservation = await db.reservation.findUnique({
      where: { id: claim.reservationId },
    });
    if (!reservation) return jsonError("رزرو مرتبط یافت نشد.", 404);
    if (reservation.status !== "DISPUTED")
      return jsonError(
        "این سفارش دیگر در مرحله بررسی خسارت نیست؛ اختتامیه دو بار انجام نمی‌شود.",
        409,
      );

    const percentRaw = Math.floor(Number(body.percentToRenter ?? NaN));
    if (!Number.isFinite(percentRaw) || percentRaw < 0 || percentRaw > 100) {
      return jsonError(
        "درصد آزادسازی ودیعه برای مستأجر باید عددی بین ۰ تا ۱۰۰ باشد.",
        422,
      );
    }
    const deposit = reservation.deposit;
    const toRenter = Math.floor((deposit * percentRaw) / 100);
    const toHost = deposit - toRenter;
    const depositWasHeld = reservation.depositStatus === "HELD";

    // When no deposit is escrowed (legacy orders whose deposit was never
    // charged), the host's share is executed against the renter's wallet
    // balance (never negative — the whole ruling rolls back otherwise).
    if (!depositWasHeld && toHost > 0) {
      const renter = await db.user.findUnique({
        where: { id: reservation.renterId },
        select: { walletBalance: true },
      });
      if (!renter || renter.walletBalance < toHost)
        return jsonError(
          "ودیعهٔ نقدی برای این سفارش بلوکه نشده است و موجودی کیف پول مستأجر برای اجرای سهم میزبان کافی نیست؛ ابتدا شارژ کیف پول مستأجر را پیگیری کنید.",
          402,
        );
    }

    const note = String(body.decision ?? "").trim();
    const settlementNote =
      note ||
      `رأی مدیریت: ${percentRaw.toLocaleString("fa-IR")}٪ ودیعه به مستأجر آزاد شد${toHost > 0 ? ` و مابقی (${toHost.toLocaleString("fa-IR")} تومان) به کیف پول میزبان واریز گردید` : ""} (حالت شبیه‌سازی).`;

    let settleError: Response | null = null;
    const updated = await db.$transaction(async (tx) => {
      const claimUpd = await tx.damageClaim.update({
        where: { id },
        data: {
          status: "SETTLED",
          decision: settlementNote,
          decidedAt: new Date(),
          settlementNote,
          percentToRenter: percentRaw,
          chargeAmount: toHost,
        },
      });

      // Ledger + balances (sandbox).
      const entries: {
        userId: string; type: string; amount: number; reference: string; description: string;
      }[] = [];
      if (depositWasHeld) {
        // The escrowed deposit physically leaves the escrow ledger: the
        // ruled percent goes to the renter, the remainder to the host.
        if (toRenter > 0)
          entries.push({ userId: reservation.renterId, type: "DEPOSIT_RELEASE", amount: toRenter, reference: reservation.code, description: `آزادسازی ${percentRaw.toLocaleString("fa-IR")}٪ ودیعه به کیف پول مستأجر طبق رأی مدیریت — حالت شبیه‌سازی` });
        if (toHost > 0)
          entries.push({ userId: reservation.hostId, type: "DISPUTE_SETTLEMENT", amount: toHost, reference: reservation.code, description: `واریز سهم میزبان از ودیعه (${(100 - percentRaw).toLocaleString("fa-IR")}٪) طبق رأی مدیریت — حالت شبیه‌سازی` });
      } else if (toHost > 0) {
        entries.push({ userId: reservation.renterId, type: "DISPUTE_CHARGE", amount: -toHost, reference: reservation.code, description: `اجرای رأی مدیریت از کیف پول مستأجر (ودیعه نقدی نشده بود) — حالت شبیه‌سازی` });
        entries.push({ userId: reservation.hostId, type: "DISPUTE_SETTLEMENT", amount: toHost, reference: reservation.code, description: `دریافت سهم میزبان طبق رأی مدیریت — حالت شبیه‌سازی` });
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

      // Close the rental out: the damage case is decided, the deposit is
      // settled — the order completes with a verdict event on its timeline.
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "COMPLETED",
          depositStatus: depositWasHeld ? "REFUNDED" : reservation.depositStatus,
          events: {
            create: {
              actor: "admin",
              type: "RELEASE_DEPOSIT",
              message: `اختتامیهٔ پروندهٔ خسارت: رأی مدیریت اجرا شد — ${percentRaw.toLocaleString("fa-IR")}٪ ودیعه (${toRenter.toLocaleString("fa-IR")} تومان) به کیف پول مستأجر آزاد شد${toHost > 0 ? ` و مابقی (${toHost.toLocaleString("fa-IR")} تومان) به کیف پول میزبان واریز شد` : ""} — پرونده: ${claim.title}`,
            },
          },
        },
      });

      await tx.notification.create({
        data: { userId: reservation.renterId, type: "DISPUTE", title: "رأی مدیریت صادر و اجرا شد", body: `پروندهٔ «${claim.title}»: ${percentRaw.toLocaleString("fa-IR")}٪ ودیعه به کیف پول شما آزاد شد${toHost > 0 ? " و مابقی به کیف پول میزبان واریز گردید" : ""}. جزئیات در روند اجاره.`, link: `/rental-lifecycle/${reservation.id}` },
      });
      await tx.notification.create({
        data: { userId: reservation.hostId, type: "DISPUTE", title: "رأی مدیریت صادر و اجرا شد", body: `پروندهٔ «${claim.title}»: رأی مدیریت اجرا و ودیعه تسویه شد؛ جزئیات در روند اجاره.`, link: `/rental-lifecycle/${reservation.id}` },
      });

      return claimUpd;
    }).catch((e: unknown) => {
      if (settleError) return settleError;
      throw e;
    });

    if (updated instanceof Response) return updated;

    await db.auditLog.create({
      data: { actorId: auth.user.id, action: "CLAIM_SETTLED", entityType: "DamageClaim", entityId: id, meta: JSON.stringify({ percentToRenter: percentRaw, toRenter, toHost }) },
    });
    return jsonOk({ claim: updated });
  }

  // Non-settlement transitions (e.g. «ارسال به بررسی کارشناسی»).
  const updated = await db.damageClaim.update({
    where: { id },
    data: {
      status,
      decision: status === "DECIDED" ? String(body.decision ?? "تصمیم کارشناس ثبت شد.") : claim.decision,
      decidedAt: status === "DECIDED" ? new Date() : claim.decidedAt,
    },
  });

  await db.auditLog.create({
    data: { actorId: auth.user.id, action: `CLAIM_${status}`, entityType: "DamageClaim", entityId: id, meta: JSON.stringify(body) },
  });

  await db.notification.create({
    data: { userId: claim.againstId, type: "DISPUTE", title: "به‌روزرسانی پرونده خسارت", body: `وضعیت پروندهٔ «${claim.title}» به مرحله بررسی کارشناسی رفت؛ رأی تا حداکثر یک هفته از طریق گفتگوی پرونده اعلام می‌شود.`, link: `/rental-lifecycle/${claim.reservationId}` },
  });

  return jsonOk({ claim: updated });
}
