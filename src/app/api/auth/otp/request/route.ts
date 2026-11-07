import { db } from "@/lib/db";
import { generateOtp, OTP_DEMO_MODE } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

/**
 * POST /api/auth/otp/request — create a 4-digit OTP.
 * Demo mode (no SMS provider configured): the code is returned in the
 * response and shown on screen. NEVER enable this behaviour in production.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = String(body.phone ?? "").replace(/\s/g, "");
    if (!/^09\d{9}$/.test(phone)) return jsonError("شماره موبایل معتبر نیست.");

    // simple rate limit: max 3 codes per phone per 10 minutes
    const recent = await db.otpCode.count({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recent >= 3)
      return jsonError("تعداد درخواست کد بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.", 429);

    const code = generateOtp();
    await db.otpCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      },
    });

    if (OTP_DEMO_MODE) {
      return jsonOk({
        ok: true,
        demoMode: true,
        devCode: code,
        message:
          "حالت توسعه: ارسال پیامکی فعال نیست؛ کد نمایش‌داده‌شده را وارد کنید.",
      });
    }
    // Production path (when SMS_PROVIDER_API_KEY is configured) would call the
    // SMS provider here. Not implemented until real credentials are supplied.
    return jsonOk({ ok: true });
  } catch {
    return jsonError("خطای غیرمنتظره در ارسال کد.", 500);
  }
}
