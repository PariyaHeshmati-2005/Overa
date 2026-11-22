import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { normalizeIranMobile } from "@/lib/persian";

/** POST /api/auth/otp/verify — verify the OTP and sign in (create account if needed). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code ?? "").replace(/\s/g, "");
    // Same canonical «09…» form the request route stored, so the code always
    // matches regardless of how the visitor typed the number.
    const phone = normalizeIranMobile(String(body.phone ?? "")) ?? "";
    if (!/^09\d{9}$/.test(phone)) return jsonError("شماره موبایل معتبر نیست.");
    if (!/^\d{4}$/.test(code)) return jsonError("کد تایید ۴ رقمی را وارد کنید.");

    const otp = await db.otpCode.findFirst({
      where: { phone, consumed: false, code, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) return jsonError("کد وارد‌شده صحیح نیست یا منقضی شده است.", 401);

    await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

    let user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      const fallbackName = "کاربر " + phone.slice(-4);
      user = await db.user.create({ data: { phone, name: fallbackName } });
    }
    await createSession(user.id);
    return jsonOk({
      user: { id: user.id, name: user.name, phone: user.phone, isHost: user.isHost },
    });
  } catch {
    return jsonError("خطای غیرمنتظره در تایید کد.", 500);
  }
}
