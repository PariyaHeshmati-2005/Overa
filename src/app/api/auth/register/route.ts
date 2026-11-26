import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { normalizeIranMobile } from "@/lib/persian";

/** POST /api/auth/register — create an account (phone + password). */
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

    const existing = await db.user.findUnique({ where: { phone } });
    if (existing)
      return jsonError("این شماره موبایل قبلاً ثبت شده است؛ وارد شوید.", 409);

    const user = await db.user.create({
      data: {
        name,
        phone,
        passwordHash: hashPassword(password),
        city: body.city ? String(body.city) : null,
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
