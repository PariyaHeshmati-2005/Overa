import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

/** POST /api/auth/login — password sign-in (demo adapter, clearly labelled in UI). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = String(body.phone ?? "").replace(/\s/g, "");
    const password = String(body.password ?? "");
    if (!phone || !password) return jsonError("شماره موبایل و رمز عبور الزامی است.");

    const user = await db.user.findUnique({ where: { phone } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash))
      return jsonError("شماره موبایل یا رمز عبور اشتباه است.", 401);

    await createSession(user.id);
    return jsonOk({
      user: { id: user.id, name: user.name, phone: user.phone, isHost: user.isHost },
    });
  } catch {
    return jsonError("خطای غیرمنتظره در ورود.", 500);
  }
}
