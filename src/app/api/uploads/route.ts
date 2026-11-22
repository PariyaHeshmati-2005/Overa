import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

/**
 * POST /api/uploads — save one user-supplied image (base64 data URL) and
 * return its public path. Used by the create-listing wizard's "upload from my
 * device" picker (phone or laptop).
 *
 * Constraints: authenticated users only; images only (jpeg/png/webp); max
 * 5 MB decoded; stored under <cwd>/public/uploads with a random name; in
 * production-standalone the standalone public dir is kept in sync when it
 * exists so runtime-uploaded images are served too.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const MIME_BY_PREFIX: Record<string, string> = {
  "data:image/jpeg;base64,": "jpg",
  "data:image/jpg;base64,": "jpg",
  "data:image/png;base64,": "png",
  "data:image/webp;base64,": "webp",
};

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await req.json().catch(() => ({}));
  const dataUrl = String(body.dataUrl ?? "");
  const prefix = Object.keys(MIME_BY_PREFIX).find((p) => dataUrl.startsWith(p));
  if (!prefix) {
    return jsonError("فقط تصویر با فرمت JPEG، PNG یا WEBP پذیرفته می‌شود.", 415);
  }
  const base64 = dataUrl.slice(prefix.length);
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0) return jsonError("فایل تصویر خالی است.", 422);
  if (bytes.length > MAX_BYTES) {
    return jsonError("حجم تصویر بیش از ۵ مگابایت است؛ نسخه کوچک‌تری انتخاب کنید.", 413);
  }

  const ext = MIME_BY_PREFIX[prefix];
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  // Standalone production serves public/ from .next/standalone/public — keep
  // both copies in sync when that directory exists (best-effort, dev-safe).
  try {
    const standaloneDir = path.join(process.cwd(), ".next", "standalone", "public", "uploads");
    await fs.mkdir(standaloneDir, { recursive: true });
    await fs.writeFile(path.join(standaloneDir, name), bytes);
  } catch {
    /* dev mode — not needed */
  }

  await db.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: "IMAGE_UPLOAD",
      entityType: "ListingImage",
      entityId: null,
      meta: JSON.stringify({ size: bytes.length, ext }),
    },
  });

  return jsonOk({ url: `/uploads/${name}` }, 201);
}
