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
  // (rental fee + refundable deposit) is drawn from their wallet — when the
  // balance is insufficient the client is told to top up FIRST
  // (extra.needTopup drives the «شارژ کیف پول» redirect in the UI).
  const payCost = reservation.subtotal + reservation.deposit;
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
      // SANDBOX payment adapter — visibly labelled everywhere.
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
    case "dispute":
      dataExtra.disputeOpenedAt = new Date();
      addEvent(String(body.note ?? "اعلام اختلاف/خسارت برای این اجاره؛ سفارش به مرحله بررسی اختلاف منتقل شد."));
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
    case "cancel": {
      addEvent("رزرو لغو شد.");
      if (["AGREEMENT", "PAYMENT", "PAID"].includes(reservation.status)) {
        // refund whatever was paid (sandbox)
        walletEntries.push(
          { userId: reservation.renterId, type: "RENTAL_REFUND", amount: reservation.subtotal, reference: reservation.code, description: "بازگشت وجه اجاره پس از لغو — حالت شبیه‌سازی" },
          { userId: reservation.renterId, type: "DEPOSIT_RELEASE", amount: reservation.deposit, reference: reservation.code, description: "آزادسازی ودیعه پس از لغو — حالت شبیه‌سازی" },
        );
        balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.subtotal + reservation.deposit;
        walletEntries.push(
          { userId: reservation.hostId, type: "RENTAL_REFUND", amount: -reservation.subtotal, reference: reservation.code, description: "برگشت وجه اجاره به مستأجر — حالت شبیه‌سازی" },
        );
        balanceDelta[reservation.hostId] = (balanceDelta[reservation.hostId] ?? 0) - reservation.subtotal;
        addEvent("رزرو لغو شد؛ وجه پرداختی به‌صورت شبیه‌سازی‌شده بازگردانده شد.");
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
