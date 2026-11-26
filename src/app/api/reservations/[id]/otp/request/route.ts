import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";
import {
  assertOtpStageAllowed,
  createReservationOtp,
  isReservationOtpStage,
  OtpError,
  OTP_TTL_SEC,
} from "@/lib/reservation-otp";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/reservations/[id]/otp/request — issue a one-time code for one of
 * the two independent confirmation stages:
 *   - DELIVERY_RECEIVED: renter only, reservation must be DELIVERED
 *   - RETURN_RECEIVED:   host only,   reservation must be RETURN_REQUESTED
 * The phone is read from the authenticated session user — client input can
 * never choose the destination. Demo mode (no SMS provider configured) returns
 * the code in a labelled `devCode` field; production never does.
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

  const reservation = await db.reservation.findUnique({
    where: { id },
    select: { id: true, code: true, renterId: true, hostId: true, status: true },
  });
  if (!reservation) return jsonError("رزرو یافت نشد.", 404);

  try {
    // Ownership + role + current-status gate (re-checked atomically on verify).
    assertOtpStageAllowed(reservation, user, stage);
  } catch (e) {
    if (e instanceof OtpError) return jsonError(e.message, e.status);
    throw e;
  }

  try {
    const result = await createReservationOtp({
      reservationId: reservation.id,
      user: { id: user.id, phone: user.phone },
      stage,
    });
    return jsonOk({
      ok: true,
      stage,
      expiresAt: result.expiresAt.toISOString(),
      expiresInSec: OTP_TTL_SEC,
      demoMode: result.demo,
      ...(result.demo && result.devCode
        ? {
            devCode: result.devCode,
            message:
              "حالت توسعه: پیامک واقعی ارسال نشده است؛ کد نمایش‌داده‌شده را وارد کنید.",
          }
        : {}),
    });
  } catch (e) {
    if (e instanceof OtpError) return jsonError(e.message, e.status, e.extra);
    return jsonError("خطای غیرمنتظره در ارسال کد.", 500);
  }
}
