import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

/** POST /api/auth/register — create an account (phone + password). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").replace(/\s/g, "");
    const password = String(body.password ?? "");

    if (name.length < 2) return jsonError("نام و نام خانوادگی را کامل وارد کنید.");
    if (!/^09\d{9}$/.test(phone))
      return jsonError("شماره موبایل معتبر نیست؛ باید با ۰۹ شروع شده و ۱۱ رقم باشد.");
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
