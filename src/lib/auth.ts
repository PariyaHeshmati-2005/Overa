import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { db } from "@/lib/db";

const SESSION_COOKIE = "overa_session";
const SESSION_TTL_DAYS = 30;

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  isHost: boolean;
  isAdmin: boolean;
  kycStatus: string;
  walletBalance: number;
};

/* ---------------- passwords (scrypt, no external dependency) ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

/* ------------------------------- sessions -------------------------------- */

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400000);
  await db.session.create({ data: { token, userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Get the signed-in user for the current request (or null for guests). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    city: u.city,
    isHost: u.isHost,
    isAdmin: u.isAdmin,
    kycStatus: u.kycStatus,
    walletBalance: u.walletBalance,
  };
}

/* --------------------------------- OTP ----------------------------------- */

export function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Demo mode: no SMS provider is configured, so OTP codes are returned to the
 * client and visibly labelled. This is NOT production authentication.
 */
export const OTP_DEMO_MODE = !process.env.SMS_PROVIDER_API_KEY;
