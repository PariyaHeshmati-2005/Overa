import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { notifyAdmins, type NotifyDb } from "@/lib/admin-notify";
import {
  assertOtpStageAllowed,
  consumeReservationOtp,
  isReservationOtpStage,
  normalizeOtpCode,
  OtpError,
} from "@/lib/reservation-otp";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/reservations/[id]/otp/verify — verify a one-time code and apply
 * the guarded reservation state change in ONE transaction:
 *   - DELIVERY_RECEIVED (renter, DELIVERED): → RENTAL_ACTIVE + actualStartAt
 *   - RETURN_RECEIVED   (host, RETURN_REQUESTED): → COMPLETED + refund process
 * The status guard (`updateMany` on the expected status) is re-evaluated
 * inside the transaction, so concurrent clicks / stale tabs can never apply
 * the same transition twice, and a code consumed by a failed transition is
 * rolled back untouched.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const stage = body.stage;
  if (!isReservationOtpStage(stage)) {
    return jsonError("مرحله تأیید (stage) نامعتبر است.", 422);
  }
  const code = normalizeOtpCode(body.code);
  if (code.length !== 6) {
    return jsonError("کد تایید ۶ رقمی را وارد کنید.", 422);
  }

  const reservation = await db.reservation.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      renterId: true,
      hostId: true,
      status: true,
      deposit: true,
    },
  });
  if (!reservation) return jsonError("رزرو یافت نشد.", 404);

  try {
    // Ownership + role + current-status gate; the same guard is enforced
    // atomically inside the transaction below.
    assertOtpStageAllowed(reservation, user, stage);
  } catch (e) {
    if (e instanceof OtpError) return jsonError(e.message, e.status);
    throw e;
  }

  try {
    const result = await consumeReservationOtp({
      reservationId: reservation.id,
      user: { id: user.id },
      stage,
      code,
      applyStateChange: async (tx) => {
        const now = new Date();

        if (stage === "AGREEMENT_SIGNATURE") {
          // Digital contract signature — renter only (gated above). Two cases:
          //  REQUESTED → the renter signs first; the host is then notified to
          //              approve (status stays REQUESTED until they act).
          //  APPROVED  → the signature doubles as «تایید قرارداد»: the order
          //              moves to AGREEMENT and payment unlocks.
          const wasApproved = reservation.status === "APPROVED";
          const claimed = await tx.reservation.updateMany({
            where: {
              id: reservation.id,
              status: reservation.status,
              renterId: user.id,
              signedByRenterAt: null,
            },
            data: {
              signedByRenterAt: now,
              ...(wasApproved ? { status: "AGREEMENT" } : {}),
            },
          });
          if (claimed.count !== 1) {
            throw new OtpError(
              "امضای قرارداد قبلاً ثبت شده یا وضعیت سفارش تغییر کرده است؛ صفحه را به‌روزرسانی کنید.",
              409,
            );
          }
          await tx.reservationEvent.create({
            data: {
              reservationId: reservation.id,
              actor: "renter",
              type: "SIGN_AGREEMENT",
              message: wasApproved
                ? "قرارداد با امضای دیجیتال مستأجر تایید شد؛ آماده انجام پرداخت."
                : "مستأجر قرارداد را با امضای دیجیتال ثبت کرد؛ منتظر تایید مالک.",
            },
          });
          await tx.notification.create({
            data: {
              userId: reservation.hostId,
              type: "RESERVATION",
              title: wasApproved ? "قرارداد امضا و تایید شد" : "قرارداد از سوی مستأجر امضا شد",
              body: wasApproved
                ? `امضای دیجیتال «${reservation.code}» ثبت شد؛ منتظر انجام پرداخت آزمایشی هستید.`
                : `مستأجر قرارداد «${reservation.code}» را با کد یک‌بارمصرف امضا کرد؛ لطفاً شما نیز درخواست را تایید کنید.`,
              link: "/host-dashboard",
            },
          });
          return { status: wasApproved ? "AGREEMENT" : "REQUESTED" };
        }

        if (stage === "DELIVERY_RECEIVED") {
          // Renter confirms receipt → rental becomes active, real start time.
          const claimed = await tx.reservation.updateMany({
            where: { id: reservation.id, status: "DELIVERED", renterId: user.id },
            data: { status: "RENTAL_ACTIVE", actualStartAt: now },
          });
          if (claimed.count !== 1) {
            throw new OtpError(
              "وضعیت سفارش تغییر کرده است؛ صفحه را به‌روزرسانی و دوباره تلاش کنید.",
              409,
            );
          }
          await tx.reservationEvent.create({
            data: {
              reservationId: reservation.id,
              actor: "renter",
              type: "CONFIRM_DELIVERY",
              message:
                "دریافت کالا با کد یک‌بارمصرف توسط مستأجر تأیید شد؛ دوره اجاره فعال و زمان شروع واقعی ثبت گردید.",
            },
          });
          await tx.notification.create({
            data: {
              userId: reservation.hostId,
              type: "RESERVATION",
              title: "دریافت کالا تأیید شد",
              body: `مستأجر دریافت «${reservation.code}» را تأیید کرد؛ دوره اجاره فعال شد.`,
              link: "/host-dashboard",
            },
          });
          return { status: "RENTAL_ACTIVE" };
        }

        // RETURN_RECEIVED — host confirms a healthy return.
        // Optional free-text protocol reuses the existing hostProtocol field.
        const protocol =
          String(body.note ?? "").trim() ||
          "کالا سالم بازگشت داده شد؛ تأیید دریافت با کد یک‌بارمصرف انجام شد.";
        const claimed = await tx.reservation.updateMany({
          where: { id: reservation.id, status: "RETURN_REQUESTED", hostId: user.id },
          data: {
            status: "COMPLETED",
            returnConfirmedAt: now,
            depositStatus: "REFUND_PENDING",
            hostProtocol: protocol,
          },
        });
        if (claimed.count !== 1) {
          throw new OtpError(
            "وضعیت سفارش تغییر کرده است؛ صفحه را به‌روزرسانی و دوباره تلاش کنید.",
            409,
          );
        }
        await tx.reservationEvent.create({
          data: {
            reservationId: reservation.id,
            actor: "host",
            type: "CONFIRM_RETURN",
            message:
              "بازگشت کالا با کد یک‌بارمصرف توسط میزبان تأیید شد؛ سفارش تکمیل و فرآیند بازگشت ودیعه آغاز گردید (شبیه‌سازی).",
          },
        });
        // Deposit refund pipeline is sandbox-only: record the pending refund
        // entry without any balance movement (settlement is operator-side).
        await tx.walletTransaction.create({
          data: {
            userId: reservation.renterId,
            type: "DEPOSIT_RELEASE",
            amount: reservation.deposit,
            status: "PENDING",
            reference: reservation.code,
            description:
              "آغاز فرآیند بازگشت ودیعه — حالت شبیه‌سازی؛ تسویه نهایی توسط اپراتور انجام می‌شود.",
          },
        });
        await tx.notification.create({
          data: {
            userId: reservation.renterId,
            type: "RESERVATION",
            title: "بازگشت کالا تأیید شد",
            body: `میزبان بازگشت «${reservation.code}» را تأیید کرد؛ سفارش تکمیل شد و فرآیند بازگشت ودیعه آغاز گردید.`,
            link: "/rentals",
          },
        });
        // Oversight: the admin must know this item came back safe and sound
        // (and that the deposit refund pipeline is waiting to be settled).
        await notifyAdmins(
          tx as unknown as NotifyDb,
          {
            type: "RESERVATION",
            title: "بازگشت سالم کالا تأیید شد",
            body: `سفارش «${reservation.code}» تکمیل شد: کالا با تأیید میزبان سالم به مالک بازگشته و فرآیند بازگشت ودیعه آغاز شده است (تسویه نهایی در پنل مدیریت).`,
            link: "/admin-dashboard",
          },
          [reservation.renterId, reservation.hostId],
        );
        return { status: "COMPLETED" };
      },
    });

    return jsonOk({ ok: true, stage, ...result });
  } catch (e) {
    if (e instanceof OtpError) return jsonError(e.message, e.status, e.extra);
    return jsonError("خطای غیرمنتظره در تأیید کد.", 500);
  }
}
