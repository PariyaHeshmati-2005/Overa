import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { notifyAdmins, type NotifyDb } from "@/lib/admin-notify";
import { faCountWord } from "@/lib/format";
import { createHostAutoComment } from "@/lib/host-comments";
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
  // redirect in the UI). The pay stage charges the DEPOSIT (ودیعه) ONLY — the
  // daily-rate rent is charged after the renter confirms receipt (OTP flow).
  const payCost = action === "pay" ? reservation.deposit : 0;
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
         moves ONLY on the completing press — and it covers the DEPOSIT
         (ودیعه) ONLY: the daily-rate rent is charged later, right after the
         renter confirms receipt («سلامت تحویل گرفتم») when the rental
         actually starts. */
      if (reservation.status !== "PAYMENT") {
        addEvent("فرآیند پرداخت ودیعه آغاز شد؛ برای نهایی‌شدن، پرداخت را تأیید کنید.");
        break;
      }
      // SANDBOX payment adapter — visibly labelled everywhere. Deposit escrow.
      dataExtra.paymentMethod = "CASH";
      addEvent(
        `پرداخت ودیعه (${reservation.deposit.toLocaleString("fa-IR")} تومان) در حالت آزمایشی (Sandbox) انجام شد؛ هزینهٔ اجارهٔ روزانه پس از تأیید دریافت کالا محاسبه می‌شود.`,
      );
      dataExtra.depositStatus = "HELD";
      walletEntries.push(
        { userId: reservation.renterId, type: "DEPOSIT_HOLD", amount: -reservation.deposit, reference: reservation.code, description: `بلوکه شدن ودیعه ${reservation.listing.title} — حالت شبیه‌سازی` },
      );
      balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) - reservation.deposit;
      // Guarded inside the transaction below: the renter's balance must cover
      // the cost, otherwise the whole transition (and payment) rolls back.
      await db.notification.create({ data: { userId: reservation.hostId, type: "RESERVATION", title: "ودیعه پرداخت شد", body: `ودیعهٔ رزرو «${reservation.code}» پرداخت و بلوکه شد؛ وسیله را به مستأجر تحویل دهید.`, link: "/host-dashboard" } });
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
    case "dispute": {
      dataExtra.disputeOpenedAt = new Date();
      const note = String(body.note ?? "").trim();
      addEvent(note || "اعلام اختلاف/خسارت برای این اجاره؛ سفارش به مرحله بررسی خسارت منتقل شد.");
      // Unified damage pipeline: EVERY dispute — whether opened mid-rental
      // from the lifecycle action row or by the host at the return stage
      // (declare_damage) — materialises as a DamageClaim row so it lands in
      // the admin dashboard's «اعلام خسارت‌ها» queue where the ruling is made.
      const existingClaim = await db.damageClaim.findFirst({
        where: { reservationId: id, claimantId: user.id, status: { in: ["OPEN", "COUNTER_EVIDENCE", "UNDER_REVIEW", "APPEALED", "DECIDED"] } },
        select: { id: true },
      });
      if (!existingClaim) {
        const otherSide = reservation.renterId === user.id ? reservation.hostId : reservation.renterId;
        await db.damageClaim.create({
          data: {
            reservationId: id,
            claimantId: user.id,
            againstId: otherSide,
            title: `اعلام خسارت برای سفارش ${reservation.code}`,
            description: note || "اعلام خسارت از صفحهٔ روند اجاره ثبت شد؛ شرح تکمیلی از طریق گفتگوی پرونده اعلام می‌شود.",
            status: "OPEN",
          },
        });
      }
      // Oversight: admins must see the dispute the moment it is declared.
      await notifyAdmins(
        db as unknown as NotifyDb,
        {
          type: "DISPUTE",
          title: "اعلام خسارت برای یک سفارش",
          body: `برای سفارش «${reservation.code}» خسارت ثبت شد؛ جزئیات، گفتگو با مستأجر و صدور رأی در بخش «اعلام خسارت‌ها» پنل مدیریت.`,
          link: "/admin-dashboard",
        },
        [reservation.renterId, reservation.hostId],
      );
      break;
    }
    case "declare_damage": {
      /* Host declares damage when the renter hands the item back: the order
         goes to DISPUTED and the case lands DIRECTLY in the admin dashboard's
         «اعلام خسارت‌ها» section. The admin chats with the renter there and
         must issue the deposit-split ruling within one week. */
      const note = String(body.note ?? "").trim();
      if (note.length < 20) {
        return jsonError("شرح خسارت باید حداقل ۲۰ کاراکتر باشد تا پرونده در پنل مدیریت ثبت شود.", 422);
      }
      dataExtra.disputeOpenedAt = new Date();
      addEvent(`میزبان هنگام بازگشت کالا خسارت اعلام کرد: ${note}`);
      const otherSide = reservation.renterId;
      await db.damageClaim.create({
        data: {
          reservationId: id,
          claimantId: user.id,
          againstId: otherSide,
          title: `اعلام خسارت میزبان برای سفارش ${reservation.code}`,
          description: note,
          status: "OPEN",
          stage: "RETURN",
        },
      });
      await db.notification.create({
        data: {
          userId: reservation.renterId,
          type: "DISPUTE",
          title: "اعلام خسارت از سوی میزبان",
          body: `میزبان برای «${reservation.code}» هنگام بازگشت کالا خسارت اعلام کرد؛ پرونده به کارشناسان اٌوِرا ارجاع شد و رأی تا حداکثر یک هفته از طریق گفتگوی پرونده اعلام می‌شود.`,
          link: `/rental-lifecycle/${reservation.id}`,
        },
      });
      await notifyAdmins(
        db as unknown as NotifyDb,
        {
          type: "DISPUTE",
          title: "اعلام خسارت جدید در بخش «اعلام خسارت‌ها»",
          body: `میزبان برای سفارش «${reservation.code}» خسارت اعلام کرد؛ شرح خسارت، گفتگو با مستأجر و صدور رأی (حداکثر یک هفته) در بخش «اعلام خسارت‌ها» پنل مدیریت.`,
          link: "/admin-dashboard",
        },
        [reservation.renterId, reservation.hostId],
      );
      break;
    }
    case "refuse_delivery": {
      // Renter inspected the item at hand-over, found it damaged and refuses
      // to take it («عدم تحویل و اعلام خسارت»): the WHOLE rental process is
      // stopped, the escrowed deposit flows back to the renter's WALLET and a
      // failed-rental comment is recorded on the host's reviews — with a
      // cumulative counter that grows with every failed rental.
      dataExtra.deliveryStatus = "REFUSED_DAMAGE";
      const refuseNote = String(body.note ?? "").trim();
      if (refuseNote) dataExtra.deliveryNote = refuseNote;
      const depositWasHeld = reservation.depositStatus === "HELD";
      if (depositWasHeld) dataExtra.depositStatus = "REFUNDED";
      // Was the rent itself already charged? New-flow orders charge the rent
      // only AFTER receipt confirmation (never reached here); legacy orders
      // paid the rent upfront at the pay stage. The wallet ledger decides.
      const rentWasCharged = Boolean(
        await db.walletTransaction.findFirst({
          where: { reference: reservation.code, userId: reservation.renterId, type: "RENTAL_PAYMENT", amount: { lt: 0 } },
          select: { id: true },
        }),
      );
      addEvent(
        `مستأجر هنگام تحویل، عدم تحویل و اعلام خسارت را ثبت کرد${refuseNote ? `: ${refuseNote}` : ""}؛ فرآیند اجاره به‌طور کامل متوقف و ودیعه به کیف پول مستأجر بازگشت (شبیه‌سازی).`,
      );
      const refundEntries: { userId: string; type: string; amount: number; reference: string; description: string }[] = [];
      if (rentWasCharged) {
        refundEntries.push(
          { userId: reservation.renterId, type: "RENTAL_REFUND", amount: reservation.subtotal, reference: reservation.code, description: "بازگشت وجه اجاره — توقف اجاره هنگام تحویل (شبیه‌سازی)" },
          { userId: reservation.hostId, type: "RENTAL_REFUND", amount: -reservation.subtotal, reference: reservation.code, description: "برگشت وجه اجاره به مستأجر — توقف اجاره هنگام تحویل (شبیه‌سازی)" },
        );
        balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.subtotal;
        balanceDelta[reservation.hostId] = (balanceDelta[reservation.hostId] ?? 0) - reservation.subtotal;
      }
      if (depositWasHeld) {
        refundEntries.push({ userId: reservation.renterId, type: "DEPOSIT_RELEASE", amount: reservation.deposit, reference: reservation.code, description: "آزادسازی کامل ودیعه و واریز به کیف پول مستأجر — توقف اجاره هنگام تحویل (شبیه‌سازی)" });
        balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.deposit;
      }
      walletEntries.push(...refundEntries);
      // Failed-rental comment on the host's reviews (cumulative counter —
      // +1 because this refusal itself is persisted in the transaction below).
      const failedCount =
        (await db.reservation.count({
          where: { hostId: reservation.hostId, deliveryStatus: "REFUSED_DAMAGE" },
        })) + 1;
      await createHostAutoComment({
        listingId: reservation.listingId,
        authorId: reservation.renterId,
        reservationId: reservation.id,
        rating: 1,
        comment: `${faCountWord(failedCount)} اجاره ناموفق به دلیل وجود خسارت و عدم سازگاری با توضیحات و قوانین`,
        hostId: reservation.hostId,
        reservationCode: reservation.code,
        title: "یک اجاره ناموفق در نظرات شما ثبت شد",
      });
      await db.notification.create({ data: { userId: reservation.hostId, type: "DISPUTE", title: "مستأجر کالا را تحویل ن گرفت", body: `مستأجر هنگام تحویل «${reservation.code}» عدم تحویل و خسارت اعلام کرد؛ فرآیند اجاره متوقف و ودیعه به کیف پول مستأجر واریز شد. یک اجاره ناموفق در بخش نظرات شما ثبت گردید.`, link: `/rental-lifecycle/${reservation.id}` } });
      await notifyAdmins(
        db as unknown as NotifyDb,
        {
          type: "DISPUTE",
          title: "توقف اجاره هنگام تحویل (عدم تحویل و اعلام خسارت)",
          body: `سفارش «${reservation.code}» به‌علت عدم تحویل و اعلام خسارت توسط مستأجر متوقف شد؛ ودیعه به کیف پول مستأجر بازگشت و اجارهٔ ناموفق در نظرات میزبان ثبت گردید.`,
          link: "/admin-dashboard",
        },
        [reservation.renterId, reservation.hostId],
      );
      break;
    }
    case "cancel": {
      addEvent("رزرو لغو شد.");
      if (["AGREEMENT", "PAYMENT", "PAID"].includes(reservation.status)) {
        // Refund ONLY what was actually charged (sandbox): the deposit when
        // escrowed, plus the rent for legacy orders that paid it upfront —
        // new orders charge the rent only after the receipt confirmation.
        const depositWasHeld = reservation.depositStatus === "HELD";
        const rentWasCharged = Boolean(
          await db.walletTransaction.findFirst({
            where: { reference: reservation.code, userId: reservation.renterId, type: "RENTAL_PAYMENT", amount: { lt: 0 } },
            select: { id: true },
          }),
        );
        if (rentWasCharged) {
          walletEntries.push(
            { userId: reservation.renterId, type: "RENTAL_REFUND", amount: reservation.subtotal, reference: reservation.code, description: "بازگشت وجه اجاره پس از لغو — حالت شبیه‌سازی" },
            { userId: reservation.hostId, type: "RENTAL_REFUND", amount: -reservation.subtotal, reference: reservation.code, description: "برگشت وجه اجاره به مستأجر — حالت شبیه‌سازی" },
          );
          balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.subtotal;
          balanceDelta[reservation.hostId] = (balanceDelta[reservation.hostId] ?? 0) - reservation.subtotal;
        }
        if (depositWasHeld) {
          walletEntries.push(
            { userId: reservation.renterId, type: "DEPOSIT_RELEASE", amount: reservation.deposit, reference: reservation.code, description: "آزادسازی ودیعه پس از لغو — حالت شبیه‌سازی" },
          );
          balanceDelta[reservation.renterId] = (balanceDelta[reservation.renterId] ?? 0) + reservation.deposit;
        }
        addEvent(
          depositWasHeld
            ? "رزرو لغو شد؛ ودیعهٔ بلوکه‌شده و (در صورت پرداخت) وجه اجاره به‌صورت شبیه‌سازی‌شده بازگردانده شد."
            : "رزرو لغو شد؛ هیچ مبلغی پرداخت نشده بود.",
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
