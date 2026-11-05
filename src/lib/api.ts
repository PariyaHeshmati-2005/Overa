import "server-only";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, ...(extra ? { extra } : {}) }, { status });
}

/** Returns the session user or responds 401. */
export async function requireUser(): Promise<
  { user: SessionUser; response?: never } | { user?: never; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: jsonError("برای این عملیات باید وارد حساب خود شوید.", 401) };
  }
  return { user };
}

export async function requireAdmin(): Promise<
  { user: SessionUser; response?: never } | { user?: never; response: NextResponse }
> {
  const result = await requireUser();
  if (result.response) return result;
  if (!result.user.isAdmin) {
    return { response: jsonError("دسترسی فقط برای مدیران مجاز است.", 403) };
  }
  return { user: result.user };
}

// Pure helper lives in format.ts (dependency-free, unit-testable).
export { parseIntSafe } from "@/lib/format";
