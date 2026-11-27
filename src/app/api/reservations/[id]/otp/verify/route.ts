import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { notifyAdmins, type NotifyDb } from "@/lib/admin-notify";
import { faCountWord } from "@/lib/format";
import { createHostAutoComment } from "@/lib/host-comments";
import { assertOtpStageAllowed, consumeReservationOtp, isReservationOtpStage, normalizeOtpCode, OtpError } from "@/lib/reservation-otp";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/reservations/[id]/otp/verify — verify a one-time code and apply
 * the guarded reservation state change in ONE transaction:
 *   - DELIVERY_RECEIVED (renter, DELIVERED): → RENTAL_ACTIVE + actualStartAt
 *     + the daily-rate rent is charged from the renter's wallet (the rental
 *     process starts AFTER the «سلامت تحویل گرفتم» confirmation).
 *   - RETURN_RECEIVED   (host, RETURN_REQUESTED): → COMPLETED + the deposit is
 *     released automatically to the renter's wallet + a successful-rental
 *     comment is recorded on the host's reviews.
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
      listingId: true,
      renterId: true,
      hostId: true,
      status: true,
      subtotal: true,
      days: true,
      deposit: true,
      depositStatus: true,
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
          // Renter confirms receipt («سلامت تحویل گرفتم») → the rental process
          // STARTS here: the daily-rate rent (days × dailyPrice) is charged
          // NOW — after the confirmation — from the renter's wallet to the
          // host, and the real start time is recorded. The deposit was
          // already escrowed BEFORE this confirmation (pay stage).
          // Wallet guard: the rent (daily rate × days) must be covered by the
          // renter's balance — otherwise the whole verification (and the
          // consumed code) rolls back and the client is told to top up first.
          // Renter's 4% platform service fee — charged together with the
          // rent at receipt confirmation and recorded as its own ledger row.
          const platformFee = Math.round(reservation.subtotal * 0.04);
          const renterCharge = reservation.subtotal + platformFee;
          const renter = await tx.user.findUnique({
            where: { id: reservation.renterId },
            select: { walletBalance: true },
          });
          if (!renter || renter.walletBalance < renterCharge) {
            throw new OtpError(
              `برای شروع دورهٔ اجاره، هزینهٔ اجارهٔ ${reservation.days} روزه (${reservation.subtotal.toLocaleString("fa-IR")} تومان) + کارمزد خدمات پلتفرم ۴٪ (${platformFee.toLocaleString("fa-IR")} تومان) باید از کیف پول پرداخت شود؛ موجودی کیف پول شما کافی نیست؛ لطفاً ابتدا کیف پول را شارژ کنید.`,
              402,
              { needTopup: true, needed: renterCharge, currentBalance: renter?.walletBalance ?? 0 },
            );
          }
          const claimed = await tx.reservation.updateMany({
            where: { id: reservation.id, status: "DELIVERED", renterId: user.id },
            data: {
              status: "RENTAL_ACTIVE",
              actualStartAt: now,
              deliveryStatus: "ACCEPTED_CLEAN",
            },
          });
          if (claimed.count !== 1) {
            throw new OtpError(
              "وضعیت سفارش تغییر کرده است؛ صفحه را به‌روزرسانی و دوباره تلاش کنید.",
              409,
            );
          }
          // Daily-rate rent ledger (sandbox): renter debited, host credited.
          await tx.walletTransaction.create({
            data: {
              userId: reservation.renterId,
              type: "RENTAL_PAYMENT",
              amount: -reservation.subtotal,
              reference: reservation.code,
              description: `هزینهٔ اجارهٔ روزانه (${reservation.days} روز × نرخ روزانه) ${reservation.code} — پس از تأیید دریافت کالا — حالت شبیه‌سازی`,
              status: "COMPLETED",
            },
          });
          // Platform service fee ledger (sandbox): the renter's 4% fee gets
          // its own wallet-statement row (see WalletClient PLATFORM_FEE).
          await tx.walletTransaction.create({
            data: {
              userId: reservation.renterId,
              type: "PLATFORM_FEE",
              amount: -platformFee,
              reference: reservation.code,
              description: `کارمزد خدمات پلتفرم (۴٪ از مبلغ اجاره) ${reservation.code} — پس از تأیید دریافت کالا — حالت شبیه‌سازی`,
              status: "COMPLETED",
            },
          });
          await tx.walletTransaction.create({
            data: {
              userId: reservation.hostId,
              type: "RENTAL_PAYMENT",
              amount: reservation.subtotal,
              reference: reservation.code,
              description: `دریافت هزینهٔ اجارهٔ روزانه (${reservation.days} روز) ${reservation.code} — حالت شبیه‌سازی`,
              status: "COMPLETED",
            },
          });
          await tx.user.update({
            where: { id: reservation.renterId },
            data: { walletBalance: { decrement: renterCharge } },
          });
          await tx.user.update({
            where: { id: reservation.hostId },
            data: { walletBalance: { increment: reservation.subtotal } },
          });
          await tx.reservationEvent.create({
            data: {
              reservationId: reservation.id,
              actor: "renter",
              type: "CONFIRM_DELIVERY",
              message: `دریافت کالا با کد یک‌بارمصرف توسط مستأجر تأیید شد؛ روند اجاره آغاز شد و هزینهٔ اجارهٔ روزانه (${reservation.days} روز — ${reservation.subtotal.toLocaleString("fa-IR")} تومان) + کارمزد خدمات پلتفرم ۴٪ (${platformFee.toLocaleString("fa-IR")} تومان) از کیف پول کسر گردید (شبیه‌سازی).`,
            },
          });
          await tx.notification.create({
            data: {
              userId: reservation.hostId,
              type: "RESERVATION",
              title: "دریافت کالا تأیید شد",
              body: `مستأجر دریافت «${reservation.code}» را تأیید کرد؛ روند اجاره فعال شد و هزینهٔ اجارهٔ روزانه کسر گردید.`,
              link: "/host-dashboard",
            },
          });
          return { status: "RENTAL_ACTIVE" };
        }

        // RETURN_RECEIVED — host confirms a healthy return («تحویل سالم
        // گرفتم»). The rental process ENDS here: the order completes, the
        // escrowed deposit is released AUTOMATICALLY to the renter's wallet
        // and a successful-rental comment (cumulative counter) is recorded on
        // the host's reviews. Optional free-text protocol reuses hostProtocol.
        const protocol =
          String(body.note ?? "").trim() ||
          "کالا سالم بازگشت داده شد؛ تأیید دریافت با کد یک‌بارمصرف انجام شد.";
        const depositWasHeld = reservation.depositStatus === "HELD";
        const claimed = await tx.reservation.updateMany({
          where: { id: reservation.id, status: "RETURN_REQUESTED", hostId: user.id },
          data: {
            status: "COMPLETED",
            returnConfirmedAt: now,
            ...(depositWasHeld ? { depositStatus: "REFUNDED" } : {}),
            hostProtocol: protocol,
          },
        });
        if (claimed.count !== 1) {
          throw new OtpError(
            "وضعیت سفارش تغییر کرده است؛ صفحه را به‌روزرسانی و دوباره تلاش کنید.",
            409,
          );
        }
        // Automatic deposit release (sandbox): the deposit flows straight back
        // into the renter's wallet — no operator step in between.
        if (depositWasHeld) {
          await tx.walletTransaction.create({
            data: {
              userId: reservation.renterId,
              type: "DEPOSIT_RELEASE",
              amount: reservation.deposit,
              status: "COMPLETED",
              reference: reservation.code,
              description:
                "آزادسازی خودکار ودیعه و واریز به کیف پول مستأجر — بازگشت سالم کالا (حالت شبیه‌سازی)",
            },
          });
          await tx.user.update({
            where: { id: reservation.renterId },
            data: { walletBalance: { increment: reservation.deposit } },
          });
        }
        await tx.reservationEvent.create({
          data: {
            reservationId: reservation.id,
            actor: "host",
            type: "CONFIRM_RETURN",
            message: depositWasHeld
              ? `بازگشت کالا با کد یک‌بارمصرف توسط میزبان تأیید شد؛ اجاره تکمیل و ودیعه به‌صورت خودکار (${reservation.deposit.toLocaleString("fa-IR")} تومان) به کیف پول مستأجر واریز گردید (شبیه‌سازی).`
              : "بازگشت کالا با کد یک‌بارمصرف توسط میزبان تأیید شد؛ اجاره تکمیل شد.",
          },
        });
        // Successful-rental comment on the host's reviews — the text carries
        // the host's cumulative successful-rental counter (incl. this one).
        const successCount =
          (await tx.reservation.count({
            where: {
              hostId: reservation.hostId,
              status: "COMPLETED",
              claims: { none: {} },
            },
          })) ?? 0;
        await createHostAutoComment({
          listingId: reservation.listingId,
          authorId: reservation.renterId,
          reservationId: reservation.id,
          rating: 5,
          comment: `${faCountWord(successCount)} اجاره موفق — کالا سالم تحویل داده شد و ودیعه به‌صورت خودکار به کیف پول مستأجر آزاد شد`,
          hostId: reservation.hostId,
          reservationCode: reservation.code,
          title: "یک اجاره موفق در نظرات شما ثبت شد",
        });
        await tx.notification.create({
          data: {
            userId: reservation.renterId,
            type: "RESERVATION",
            title: "بازگشت کالا تأیید شد",
            body: depositWasHeld
              ? `میزبان بازگشت «${reservation.code}» را تأیید کرد؛ اجاره تکمیل و ودیعه به‌صورت خودکار به کیف پول شما واریز شد.`
              : `میزبان بازگشت «${reservation.code}» را تأیید کرد؛ اجاره تکمیل شد.`,
            link: "/rentals",
          },
        });
        // Oversight: the admin must know this rental closed successfully.
        await notifyAdmins(
          tx as unknown as NotifyDb,
          {
            type: "RESERVATION",
            title: "بازگشت سالم کالا تأیید شد",
            body: `سفارش «${reservation.code}» تکمیل شد: کالا با تأیید میزبان سالم به مالک بازگشته و ودیعه به‌صورت خودکار به کیف پول مستأجر واریز شده است.`,
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
