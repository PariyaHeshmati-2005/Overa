import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

/**
 * PATCH /api/auth/profile — update the signed-in user's basic profile.
 * Body: { name?, city?, bio? } — partial updates; validation in Persian.
 */
export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await req.json().catch(() => ({}));
  const data: { name?: string; city?: string | null; bio?: string | null } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2)
      return jsonError("نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.");
    if (name.length > 80)
      return jsonError("نام و نام خانوادگی نمی‌تواند بیش از ۸۰ کاراکتر باشد.");
    data.name = name;
  }
  if (body.city !== undefined) {
    const city = String(body.city).trim();
    if (city.length > 60)
      return jsonError("نام شهر نمی‌تواند بیش از ۶۰ کاراکتر باشد.");
    data.city = city || null;
  }
  if (body.bio !== undefined) {
    const bio = String(body.bio).trim();
    if (bio.length > 500)
      return jsonError("معرفی کوتاه باید حداکثر ۵۰۰ کاراکتر باشد.");
    data.bio = bio || null;
  }

  if (Object.keys(data).length === 0)
    return jsonError("داده‌ای برای بروزرسانی ارسال نشده است.");

  try {
    const user = await db.user.update({
      where: { id: auth.user.id },
      data,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatarUrl: true,
        bio: true,
        city: true,
        isHost: true,
        isAdmin: true,
        kycStatus: true,
      },
    });
    return jsonOk({ user });
  } catch {
    return jsonError("خطای غیرمنتظره در ذخیره تغییرات.", 500);
  }
}
