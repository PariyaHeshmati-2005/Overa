import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { normalizeIranMobile } from "@/lib/persian";

/** POST /api/auth/register — create an account (phone + password).
 *  Both registration consents (18+ age self-declaration and TOS/privacy
 *  acceptance) are validated SERVER-SIDE and recorded on the user row — the
 *  frontend checkboxes alone are never trusted. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    // Accept both formats (09… / 9… / +98…) — stored canonically as «09…».
    const phone = normalizeIranMobile(String(body.phone ?? "")) ?? "";
    const password = String(body.password ?? "");

    if (name.length < 2) return jsonError("نام و نام خانوادگی را کامل وارد کنید.");
    if (!/^09\d{9}$/.test(phone))
      return jsonError("شماره موبایل معتبر نیست؛ مثلاً ۰۹۱۲۳۴۵۶۷۸۹ را وارد کنید.");
    if (password.length < 8)
      return jsonError("رمز عبور باید حداقل ۸ کاراکتر باشد.");

    // Consent #1 — 18+ age self-declaration: must be exactly `true`; the
    // national-ID field is NOT treated as an age check in any way.
    if (body.ageConfirmed !== true)
      return jsonError(
        "برای ایجاد حساب باید تأیید کنید که حداقل ۱۸ سال سن دارید.",
        400,
      );
    // Consent #2 — TOS/privacy acceptance: must be exactly `true`.
    if (body.agreeTos !== true)
      return jsonError("برای ایجاد حساب، پذیرش قوانین و حریم خصوصی الزامی است.", 400);

    const existing = await db.user.findUnique({ where: { phone } });
    if (existing)
      return jsonError("این شماره موبایل قبلاً ثبت شده است؛ وارد شوید.", 409);

    const now = new Date();
    const user = await db.user.create({
      data: {
        name,
        phone,
        passwordHash: hashPassword(password),
        city: body.city ? String(body.city) : null,
        ageConfirmedAt: now,
        tosAcceptedAt: now,
      },
    });
    await createSession(user.id);
    return jsonOk({
      user: { id: user.id, name: user.name, phone: user.phone, isHost: user.isHost },
    }, 201);
  } catch {
    return jsonError("خطای غیرمنتظره در ثبت‌نام.", 500);
  }
}
