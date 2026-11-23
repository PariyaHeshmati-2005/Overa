import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { notifyAdmins, type NotifyDb } from "@/lib/admin-notify";
import {
  assertTransition,
  canAct,
  OTP_ONLY_ACTIONS,
  OTP_STAGE_BY_STATUS,
  RESERVATION_STATUS_LABELS,
  TransitionError,
  type ReservationAction,
  type ReservationStatus,
} from "@/lib/rental-state";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/reservations/[id] — participant/admin only. */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: {
      listing: { include: { images: true } },
      renter: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!reservation) return jsonError("رزرو یافت نشد.", 404);
  if (reservation.renterId !== user.id && reservation.hostId !== user.id && !user.isAdmin)
    return jsonError("دسترسی به این رزرو مجاز نیست.", 403);
  return jsonOk({ reservation });
}

/**
 * PATCH /api/reservations/[id] — perform a state-machine action.
 * Body: { action: ReservationAction, protocol?: string, note?: string }
 * All financial entries are created through the SANDBOX adapter and are
 * explicitly labelled; no real money movement is claimed anywhere.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: { listing: true },
  });
  if (!reservation) return jsonError("رزرو یافت نشد.", 404);

  const isRenter = reservation.renterId === user.id;
  const isHost = reservation.hostId === user.id;
  const isAdmin = user.isAdmin;
  if (!isRenter && !isHost && !isAdmin)
    return jsonError("دسترسی به این رزرو مجاز نیست.", 403);

  const body = await req.json().catch(() => ({}));
  const action = body.action as ReservationAction;
  if (!action) return jsonError("کنش (action) مشخص نشده است.");

  // OTP-gated actions must never run through this generic endpoint: the
  // renter's delivery confirmation and the host's return confirmation from
  // RETURN_REQUESTED require a verified one-time code
  // (POST /api/reservations/[id]/otp/verify). The legacy RETURNED →
  // INSPECTION confirm_return path stays available for old data.
  if (OTP_ONLY_ACTIONS.includes(action)) {
    return jsonError(
      "این کنش فقط با کد یک‌بارمصرف و از کارت تأیید دریافت کالا قابل ثبت است.",
      422,
    );
  }
  if (
    action === "confirm_return" &&
    OTP_STAGE_BY_STATUS[reservation.status as ReservationStatus] === "RETURN_RECEIVED"
  ) {
    return jsonError(
      "تأیید بازگشت این سفارش فقط با کد یک‌بارمصرف و از کارت تأیید بازگشت کالا انجام می‌شود.",
      422,
    );
  }

  const actor: "renter" | "host" | "admin" = isAdmin && !isRenter && !isHost
    ? "admin"
    : isHost
      ? "host"
      : "renter";

  // Wallet rule: balances can never go negative. The renter's sandbox payment
  // is drawn from their wallet — when the balance is insufficient the client
  // is told to top up FIRST (extra.needTopup drives the «شارژ کیف پول»
  // redirect in the UI). With the PROMISSORY (سفته) guarantee the gateway
  // charge covers the RENTAL FEE ONLY — the deposit stays un-charged because
  // it is guaranteed by the signed electronic promissory note.
  const payMethod =
    action === "pay" && String(body.method ?? "").toUpperCase() === "PROMISSORY"
      ? "PROMISSORY"
      : "CASH";
  const payCost =
    action === "pay" && payMethod === "PROMISSORY"
      ? reservation.subtotal
      : reservation.subtotal + reservation.deposit;
  if (action === "pay" && actor === "renter" && user.walletBalance < payCost) {
    return jsonError(
      `موجودی کیف پول شما (${user.walletBalance.toLocaleString("fa-IR")} تومان) برای پرداخت این سفارش (${payCost.toLocaleString("fa-IR")} تومان) کافی نیست؛ لطفاً ابتدا کیف پول را شارژ کنید.`,
      402,
      { needTopup: true, needed: payCost, currentBalance: user.walletBalance },
    );
  }

  if (!canAct(reservation.status as ReservationStatus, action, actor)) {
    return jsonError(
      `انجام «${action}» در وضعیت «${RESERVATION_STATUS_LABELS[reservation.status as ReservationStatus]}» برای شما مجاز نیست.`,
      422,
    );
  }

  let next: ReservationStatus;
  try {
    next = assertTransition(reservation.status as ReservationStatus, action);
  } catch (e) {
    if (e instanceof TransitionError) return jsonError(e.message, 422);
    throw e;
  }

  const events: { actor: string; type: string; message: string }[] = [
    { actor, type: action.toUpperCase(), message: "" },
  ];
  const walletEntries: {
    userId: string; type: string; amount: number; reference: string; description: string; status?: string;
  }[] = [];
  const balanceDelta: Record<string, number> = {};
  // Timeline / pipeline fields written alongside the status transition.
  const dataExtra: {
    deliveredAt?: Date;
    returnRequestedAt?: Date;
    disputeOpenedAt?: Date;
    depositStatus?: string;
    paymentMethod?: string;
    saktehSignature?: string;
    saktehSignedAt?: Date;
    deliveryStatus?: string;
    deliveryNote?: string;
  } = {};

  const addEvent = (message: string) => { events[0].message = message; };

  switch (action) {
    case "approve":
      addEvent("مالک درخواست را تایید کرد؛ منتظر تایید قرارداد.");
      await db.notification.create({ data: { userId: reservation.renterId, type: "RESERVATION", title: "درخواست شما تایید شد", body: `درخواست «${reservation.code}» تایید شد؛ لطفاً قرارداد را تایید کنید.`, link: "/rentals" } });
      break;
    case "reject":
      addEvent("درخواست رد شد.");
      await db.notification.create({ data: { userId: reservation.renterId, type: "RESERVATION", title: "درخواست رد شد", body: `درخواست «${reservation.code}» توسط مالک رد شد.`, link: "/rentals" } });
      break;
    case "confirm_agreement":
      addEvent("قرارداد و شرایط توسط مستأجر تایید شد.");
      break;
    case "pay": {
      /* The payment is TWO-STEP (AGREEMENT --pay--> PAYMENT --pay--> PAID):
         the first press starts the payment, the second completes it. Money
         moves ONLY on the completing press — otherwise the rental fee (and
         deposit) would be charged TWICE from the renter's wallet. */
      if (reservation.status !== "PAYMENT") {
        addEvent("فرآیند پرداخت آغاز شد؛ برای نهایی‌شدن پرداخت، پرداخت را تأیید کنید.");
        break;
      }
      // SANDBOX payment adapter — visibly labelled everywhere.
      if (payMethod === "PROMISSORY") {
        // سفته الکترونیک: the renter signed the electronic promissory note in
        // the lifecycle payment card BEFORE reaching the gateway; the charge
        // below covers the rental fee ONLY and the deposit stays un-charged
        // (guaranteed by the note, settled through arbitration if needed).
        const signature = String(body.signature ?? "");
        if (!signature.startsWith("data:image/")) {
          return jsonError(
            "برای پرداخت با سفته الکترونیک، ابتدا متن سفته را در کادر امضا بنویسید و امضا را ثبت کنید.",
            422,
          );
        }
        dataExtra.paymentMethod = "PROMISSORY";
        dataExtra.saktehSignature = signature;
        dataExtra.saktehSignedAt = new Date();
        // depositStatus stays NONE: no deposit money was taken — the note
        // itself is the guarantee. The refund pipeline therefore skips the
        // deposit step on completion (see the OTP verify route).
        addEvent(
          `پرداخت هزینه اجاره (${reservation.subtotal.toLocaleString("fa-IR")} تومان) با ضمانت سفته الکترونیک انجام شد؛ ودیعه نقدی نشده است (Sandbox).`,
        );
        walletEntries.push(
          { userId: reservation.renterId, type: "RENTAL_PAYMENT", amount: -reservation.subtotal, reference: reservation.code, description: `پرداخت اجاره ${reservation.listing.title} با ضمانت سفته — حالت شبیه‌سازی` },
          { userId: reservation.hostId, type: "RENTAL_PAYMENT", amount: reservation.subtotal, reference: reservation.code, description: `دریافت اجاره ${reservation.listing.title} — حالت شبیه‌سازی` },
        );
        balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) - reservation.subtotal;
        balanceDelta[reservation.hostId] = (balanceDelta[reservation.hostId] ?? 0) + reservation.subtotal;
        await db.notification.create({ data: { userId: reservation.hostId, type: "RESERVATION", title: "پرداخت با سفته انجام شد", body: `پرداخت رزرو «${reservation.code}» با ضمانت سفته الکترونیک انجام شد؛ وسیله را تحویل دهید.`, link: "/host-dashboard" } });
        break;
      }
      dataExtra.paymentMethod = "CASH";
      addEvent("پرداخت در حالت آزمایشی (Sandbox) انجام شد. هیچ پول واقعی جابه‌جا نشده است.");
      dataExtra.depositStatus = "HELD";
      walletEntries.push(
        { userId: reservation.renterId, type: "RENTAL_PAYMENT", amount: -reservation.subtotal, reference: reservation.code, description: `پرداخت اجاره ${reservation.listing.title} — حالت شبیه‌سازی` },
        { userId: reservation.renterId, type: "DEPOSIT_HOLD", amount: -reservation.deposit, reference: reservation.code, description: `بلوکه شدن ودیعه — حالت شبیه‌سازی` },
        { userId: reservation.hostId, type: "RENTAL_PAYMENT", amount: reservation.subtotal, reference: reservation.code, description: `دریافت اجاره ${reservation.listing.title} — حالت شبیه‌سازی` },
      );
      balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) - reservation.subtotal - reservation.deposit;
      balanceDelta[reservation.hostId] = (balanceDelta[reservation.hostId] ?? 0) + reservation.subtotal;
      // Guarded inside the transaction below: the renter's balance must cover
      // the cost, otherwise the whole transition (and payment) rolls back.
      await db.notification.create({ data: { userId: reservation.hostId, type: "RESERVATION", title: "پرداخت انجام شد", body: `پرداخت رزرو «${reservation.code}» انجام شد؛ وسیله را تحویل دهید.`, link: "/host-dashboard" } });
      break;
    }
    case "deliver":
      // Host recorded the hand-over; the rental activates only after the
      // renter confirms receipt with a one-time code (OTP card).
      dataExtra.deliveredAt = new Date();
      addEvent("میزبان تحویل کالا را ثبت کرد؛ منتظر تأیید دریافت مستأجر با کد یک‌بارمصرف.");
      await db.notification.create({ data: { userId: reservation.renterId, type: "RESERVATION", title: "کالا تحویل ثبت شد", body: `میزبان تحویل «${reservation.code}» را ثبت کرد؛ لطفاً سلامت کالا را در کارت «تأیید دریافت کالا» با کد یک‌بارمصرف تأیید کنید.`, link: "/rentals" } });
      break;
    case "request_return":
      dataExtra.returnRequestedAt = new Date();
      addEvent("مستأجر بازگشت کالا را ثبت کرد؛ منتظر بررسی و تأیید میزبان.");
      await db.notification.create({ data: { userId: reservation.hostId, type: "RESERVATION", title: "بازگشت کالا ثبت شد", body: `مستأجر برای «${reservation.code}» بازگشت کالا را ثبت کرد؛ سلامت کالا را بررسی و در کارت تأیید بازگشت اعلام کنید.`, link: "/host-dashboard" } });
      break;
    case "confirm_return":
      addEvent("بازگشت وسیله تایید شد؛ صورت‌جلسه تحویل در حال تکمیل.");
      break;
    case "complete_inspection": {
      const protocol = String(body.protocol ?? "").trim() || "وضعیت وسیله مطلوب و بدون خسارت بود.";
      if (actor === "renter") reservation.renterProtocol = protocol;
      else reservation.hostProtocol = protocol;
      addEvent(`صورت‌جلسه تحویل ثبت شد: ${protocol}`);
      // Oversight (legacy completion path): the admin learns the item was
      // handed back healthy and the order is closed.
      await notifyAdmins(
        db as unknown as NotifyDb,
        {
          type: "RESERVATION",
          title: "بازگشت سالم کالا تأیید شد",
          body: `سفارش «${reservation.code}» پس از تکمیل صورت‌جلسه تحویل بسته شد: کالا سالم به مالک بازگشته است.`,
          link: "/admin-dashboard",
        },
        [reservation.renterId, reservation.hostId],
      );
      break;
    }
    case "release_deposit":
      addEvent("ودیعه آزاد شد و اجاره تکمیل شد (شبیه‌سازی).");
      dataExtra.depositStatus = "REFUNDED";
      walletEntries.push(
        { userId: reservation.renterId, type: "DEPOSIT_RELEASE", amount: reservation.deposit, reference: reservation.code, description: "آزادسازی ودیعه — حالت شبیه‌سازی" },
      );
      balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.deposit;
      break;
    case "dispute": {
      dataExtra.disputeOpenedAt = new Date();
      const note = String(body.note ?? "").trim();
      addEvent(note || "اعلام اختلاف/خسارت برای این اجاره؛ سفارش به مرحله بررسی اختلاف منتقل شد.");
      // Unified claims pipeline: EVERY dispute — whether opened from the
      // return card, the lifecycle action row or the claims page — materialises
      // as a DamageClaim row so it appears in /damage-claims, the host/renter
      // panels AND the admin arbitration panel (previously the dispute action
      // only flipped the status and the claim never surfaced anywhere).
      const existingClaim = await db.damageClaim.findFirst({
        where: { reservationId: id, claimantId: user.id, status: { in: ["OPEN", "COUNTER_EVIDENCE", "UNDER_REVIEW", "APPEALED"] } },
        select: { id: true },
      });
      if (!existingClaim) {
        const otherSide = reservation.renterId === user.id ? reservation.hostId : reservation.renterId;
        await db.damageClaim.create({
          data: {
            reservationId: id,
            claimantId: user.id,
            againstId: otherSide,
            title: `اعلام خسارت/اختلاف برای سفارش ${reservation.code}`,
            description: note || "اعلام خسارت/اختلاف از صفحهٔ روند اجاره ثبت شد؛ شرح تکمیلی از طریق گفتگوی پرونده اعلام می‌شود.",
            status: "OPEN",
          },
        });
      }
      // Oversight: admins must see the dispute the moment it is declared.
      await notifyAdmins(
        db as unknown as NotifyDb,
        {
          type: "DISPUTE",
          title: "اعلام اختلاف/خسارت برای یک سفارش",
          body: `برای سفارش «${reservation.code}» اختلاف/خسارت ثبت شد؛ جزئیات و مکاتبات طرفین در صفحهٔ «خسارت و داوری» قابل بررسی است.`,
          link: "/damage-claims",
        },
        [reservation.renterId, reservation.hostId],
      );
      break;
    }
    case "refuse_delivery": {
      // Renter inspected the item at hand-over, found it damaged and refuses
      // to take it: the WHOLE order is voided — every paid Toman (rent, and
      // the escrowed deposit when paid in cash) flows back to the renter.
      dataExtra.deliveryStatus = "REFUSED_DAMAGE";
      const refuseNote = String(body.note ?? "").trim();
      if (refuseNote) dataExtra.deliveryNote = refuseNote;
      const depositWasHeld = reservation.depositStatus === "HELD";
      if (depositWasHeld) dataExtra.depositStatus = "REFUNDED";
      addEvent(
        `مستأجر هنگام تحویل، خسارت کالا را اعلام و از تحویل صرف‌نظر کرد${refuseNote ? `: ${refuseNote}` : ""}؛ اجاره باطل و مبالغ پرداختی بازگردانده شد (شبیه‌سازی).`,
      );
      const refundEntries: { userId: string; type: string; amount: number; reference: string; description: string }[] = [
        { userId: reservation.renterId, type: "RENTAL_REFUND", amount: reservation.subtotal, reference: reservation.code, description: "بازگشت وجه اجاره — ابطال اجاره هنگام تحویل (شبیه‌سازی)" },
      ];
      if (depositWasHeld) {
        refundEntries.push({ userId: reservation.renterId, type: "DEPOSIT_RELEASE", amount: reservation.deposit, reference: reservation.code, description: "آزادسازی کامل ودیعه — ابطال اجاره هنگام تحویل (شبیه‌سازی)" });
      }
      walletEntries.push(...refundEntries);
      balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.subtotal + (depositWasHeld ? reservation.deposit : 0);
      walletEntries.push(
        { userId: reservation.hostId, type: "RENTAL_REFUND", amount: -reservation.subtotal, reference: reservation.code, description: "برگشت وجه اجاره به مستأجر — ابطال اجاره هنگام تحویل (شبیه‌سازی)" },
      );
      balanceDelta[reservation.hostId] = (balanceDelta[reservation.hostId] ?? 0) - reservation.subtotal;
      await db.notification.create({ data: { userId: reservation.hostId, type: "DISPUTE", title: "مستأجر کالا را تحویل ن گرفت", body: `مستأجر هنگام تحویل «${reservation.code}» خسارت اعلام کرد و اجاره باطل شد؛ مبالغ به مستأجر بازگشت. جزئیات در صفحهٔ روند اجاره.`, link: `/rental-lifecycle/${reservation.id}` } });
      await notifyAdmins(
        db as unknown as NotifyDb,
        {
          type: "DISPUTE",
          title: "ابطال اجاره هنگام تحویل (خسارت هنگام دریافت)",
          body: `سفارش «${reservation.code}» به‌علت خسارت هنگام تحویل توسط مستأجر باطل شد؛ در صورت نیاز به داوری از پنل داوری اقدام کنید.`,
          link: "/arbitration-panel",
        },
        [reservation.renterId, reservation.hostId],
      );
      break;
    }
    case "cancel": {
      addEvent("رزرو لغو شد.");
      if (["AGREEMENT", "PAYMENT", "PAID"].includes(reservation.status)) {
        // refund whatever was paid (sandbox). With the PROMISSORY guarantee no
        // deposit money was ever taken (depositStatus NONE) — refund the rent
        // only; with the CASH guarantee the escrowed deposit is released too.
        const depositWasHeld = reservation.depositStatus === "HELD";
        walletEntries.push(
          { userId: reservation.renterId, type: "RENTAL_REFUND", amount: reservation.subtotal, reference: reservation.code, description: "بازگشت وجه اجاره پس از لغو — حالت شبیه‌سازی" },
        );
        balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.subtotal;
        if (depositWasHeld) {
          walletEntries.push(
            { userId: reservation.renterId, type: "DEPOSIT_RELEASE", amount: reservation.deposit, reference: reservation.code, description: "آزادسازی ودیعه پس از لغو — حالت شبیه‌سازی" },
          );
          balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.deposit;
        }
        walletEntries.push(
          { userId: reservation.hostId, type: "RENTAL_REFUND", amount: -reservation.subtotal, reference: reservation.code, description: "برگشت وجه اجاره به مستأجر — حالت شبیه‌سازی" },
        );
        balanceDelta[reservation.hostId] = (balanceDelta[reservation.hostId] ?? 0) - reservation.subtotal;
        addEvent(
          depositWasHeld
            ? "رزرو لغو شد؛ وجه اجاره و ودیعه به‌صورت شبیه‌سازی‌شده بازگردانده شد."
            : "رزرو لغو شد؛ وجه اجاره به‌صورت شبیه‌سازی‌شده بازگردانده شد (ودیعه با سفته تضمین شده بود و نقدی نشده بود).",
        );
      }
      break;
    }
  }

  try {
    await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id },
      data: {
        status: next,
        renterProtocol: reservation.renterProtocol ?? undefined,
        hostProtocol: reservation.hostProtocol ?? undefined,
        ...dataExtra,
        events: { create: events },
      },
    });
    for (const w of walletEntries) {
      await tx.walletTransaction.create({
        data: {
          userId: w.userId, type: w.type, amount: w.amount,
          reference: w.reference, description: w.description,
          status: w.status ?? "COMPLETED",
        },
      });
    }
    for (const [userId, delta] of Object.entries(balanceDelta)) {
      if (delta !== 0) {
        // Debits are guarded: walletBalance >= |delta| must hold, so no
        // balance can ever become negative (fails the whole transaction).
        if (delta < 0) {
          const debited = await tx.user.updateMany({
            where: { id: userId, walletBalance: { gte: Math.abs(delta) } },
            data: { walletBalance: { decrement: Math.abs(delta) } },
          });
          if (debited.count !== 1) {
            throw new Error("WALLET_INSUFFICIENT_BALANCE");
          }
        } else {
          await tx.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: delta } },
          });
        }
      }
    }
  });
  } catch (e) {
    if (e instanceof Error && e.message === "WALLET_INSUFFICIENT_BALANCE") {
      return jsonError(
        "موجودی کیف پول کافی نیست؛ ابتدا کیف پول را شارژ کنید.",
        402,
        { needTopup: true, needed: payCost, currentBalance: user.walletBalance },
      );
    }
    throw e;
  }

  const updated = await db.reservation.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
  return jsonOk({ reservation: updated, status: next });
}
