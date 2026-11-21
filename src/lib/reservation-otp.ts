/**
 * Reservation one-time codes (two-sided delivery / return confirmation).
 *
 * Server-side only logic for the OTP stages DELIVERY_RECEIVED (renter
 * confirms receipt) and RETURN_RECEIVED (host confirms healthy return).
 * Stages are fully independent: a code issued for one reservation, user and
 * stage can never be verified against another.
 *
 * Rules (enforced for demo mode too):
 *   - 6 random digits per issuance (crypto.randomInt — never a fixed code)
 *   - stored HASHED (scrypt, salted, timing-safe compare — no plain text)
 *   - 5 minutes validity, single-use (consumed on success)
 *   - max 5 wrong attempts, then the code is invalidated
 *   - resend cooldown 60s, max 3 sends per 15 minutes (per reservation+user+stage)
 *   - a newly issued code invalidates all previous active codes
 *   - verification + the reservation status change run in ONE transaction
 *     (`consumeReservationOtp` applies the caller's guarded state change)
 *   - the phone number always comes from the authenticated session user,
 *     never from client input
 *
 * The SMS transport is delegated to the provider adapter in @/lib/sms so a
 * real provider can be plugged in without touching this logic.
 */
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSmsProvider } from "@/lib/sms";
import { normalizePersian } from "@/lib/persian";
import type { ReservationOtpStage } from "@/lib/rental-state";

/* --------------------------------- rules ---------------------------------- */

export const OTP_TTL_SEC = 5 * 60; // code validity: 5 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong entries allowed per code
export const OTP_RESEND_COOLDOWN_SEC = 60; // min gap between sends
export const OTP_SEND_WINDOW_SEC = 15 * 60; // sliding window for send quota
export const OTP_MAX_SENDS_PER_WINDOW = 3; // max sends per window

export const OTP_STAGES: readonly ReservationOtpStage[] = [
  "DELIVERY_RECEIVED",
  "RETURN_RECEIVED",
];

/** Typed error whose Persian message is safe to show to the user. */
export class OtpError extends Error {
  constructor(
    message: string,
    public status = 400,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function isReservationOtpStage(value: unknown): value is ReservationOtpStage {
  return value === "DELIVERY_RECEIVED" || value === "RETURN_RECEIVED";
}

/** Fold Persian/Arabic digits (and stray spaces) so «۱۲۳۴۵۶» also verifies. */
export function normalizeOtpCode(value: unknown): string {
  return normalizePersian(String(value ?? "")).replace(/[^0-9]/g, "");
}

/* ------------------------------- hashing ---------------------------------- */

function hashOtpCode(code: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(code, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyOtpHash(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(code, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

/* ----------------------------- stage guard -------------------------------- */

type StageReservation = {
  id: string;
  renterId: string;
  hostId: string;
  status: string;
};

/**
 * Role/ownership/status gate for both OTP stages. The phone is taken from the
 * session user by the caller; clients can never choose it.
 */
export function assertOtpStageAllowed(
  reservation: StageReservation,
  user: { id: string },
  stage: ReservationOtpStage,
): void {
  if (stage === "DELIVERY_RECEIVED") {
    if (reservation.renterId !== user.id)
      throw new OtpError("فقط مستأجر این سفارش می‌تواند دریافت کالا را تأیید کند.", 403);
    if (reservation.status !== "DELIVERED")
      throw new OtpError(
        "تأیید دریافت کالا فقط پس از ثبت تحویل توسط میزبان و در وضعیت «در انتظار تأیید مستأجر» امکان‌پذیر است.",
        422,
      );
    return;
  }
  // RETURN_RECEIVED
  if (reservation.hostId !== user.id)
    throw new OtpError("فقط میزبان این سفارش می‌تواند بازگشت کالا را تأیید کند.", 403);
  if (reservation.status !== "RETURN_REQUESTED")
    throw new OtpError(
      "تأیید بازگشت کالا فقط پس از ثبت بازگشت توسط مستأجر و در وضعیت «در انتظار تأیید میزبان» امکان‌پذیر است.",
      422,
    );
}

/* ------------------------------ creation ---------------------------------- */

type OtpRow = {
  id: string;
  codeHash: string;
  attempts: number;
  consumed: boolean;
  expiresAt: Date;
  createdAt: Date;
};

/** Minimal store surface (real Prisma delegate or a test fake). */
export interface ReservationOtpStore {
  count(args: {
    where: {
      reservationId: string;
      userId: string;
      stage: string;
      createdAt?: { gte: Date };
    };
  }): Promise<number>;
  findFirst(args: {
    where: { reservationId: string; userId: string; stage: string };
    orderBy: { createdAt: "desc" };
  }): Promise<OtpRow | null>;
  create(args: {
    data: {
      reservationId: string;
      userId: string;
      stage: string;
      phone: string;
      codeHash: string;
      expiresAt: Date;
    };
  }): Promise<OtpRow>;
  updateMany(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<{ count: number }>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<OtpRow>;
}

export type CreateReservationOtpParams = {
  reservationId: string;
  user: { id: string; phone: string };
  stage: ReservationOtpStage;
  store?: ReservationOtpStore;
};

export type CreateReservationOtpResult = {
  expiresAt: Date;
  /** true → demo provider (no real SMS); devCode is safe to surface. */
  demo: boolean;
  /** The plain code, ONLY in demo mode (server env-gated). */
  devCode?: string;
};

/**
 * Issue a new one-time code for (reservation, user, stage). Enforces the
 * resend cooldown and the per-window send quota, invalidates previous active
 * codes, and dispatches through the SMS adapter.
 */
export async function createReservationOtp(
  params: CreateReservationOtpParams,
): Promise<CreateReservationOtpResult> {
  const { reservationId, user, stage } = params;
  const store = params.store ?? (db.reservationOtp as unknown as ReservationOtpStore);
  const now = Date.now();

  // Max 3 sends per sliding 15-minute window (all codes, even consumed ones).
  const windowStart = new Date(now - OTP_SEND_WINDOW_SEC * 1000);
  const sentInWindow = await store.count({
    where: {
      reservationId,
      userId: user.id,
      stage,
      createdAt: { gte: windowStart },
    },
  });
  if (sentInWindow >= OTP_MAX_SENDS_PER_WINDOW) {
    throw new OtpError(
      "حداکثر ۳ بار در بازه ۱۵ دقیقه می‌توانید کد درخواست کنید؛ کمی بعد دوباره تلاش کنید.",
      429,
    );
  }

  // Resend cooldown: at least 60 seconds between two sends.
  const latest = await store.findFirst({
    where: { reservationId, userId: user.id, stage },
    orderBy: { createdAt: "desc" },
  });
  if (latest) {
    const elapsedSec = Math.floor((now - latest.createdAt.getTime()) / 1000);
    if (elapsedSec < OTP_RESEND_COOLDOWN_SEC) {
      const retryAfterSec = OTP_RESEND_COOLDOWN_SEC - elapsedSec;
      throw new OtpError(
        `برای دریافت کد جدید ${retryAfterSec} ثانیه دیگر صبر کنید.`,
        429,
        { retryAfterSec },
      );
    }
  }

  // Fresh 6-digit code per issuance (never a fixed or reused value).
  const code = crypto.randomInt(100_000, 1_000_000).toString();
  const expiresAt = new Date(now + OTP_TTL_SEC * 1000);

  // Invalidate every previous active code for this reservation+user+stage.
  await store.updateMany({
    where: { reservationId, userId: user.id, stage, consumed: false },
    data: { consumed: true },
  });

  const row = await store.create({
    data: {
      reservationId,
      userId: user.id,
      stage,
      phone: user.phone, // always the authenticated user's phone
      codeHash: hashOtpCode(code),
      expiresAt,
    },
  });

  // Hand the delivery to the provider adapter. In demo mode nothing is sent
  // and the code is surfaced through the API's labelled demo channel.
  const provider = getSmsProvider();
  const result = await provider.sendOtp(user.phone, code);
  if (!result.sent) {
    // Do not leave a verifiable code behind a failed send.
    await store.update({ where: { id: row.id }, data: { consumed: true, consumedAt: new Date() } });
    throw new OtpError(
      "ارسال پیامک ممکن نشد؛ لطفاً پس از بررسی تنظیمات سرویس پیامکی دوباره تلاش کنید.",
      502,
    );
  }

  return {
    expiresAt,
    demo: result.demo === true,
    devCode: result.demo === true ? code : undefined,
  };
}

/* ---------------------------- verification -------------------------------- */

export type ConsumeReservationOtpParams<T> = {
  reservationId: string;
  user: { id: string };
  stage: ReservationOtpStage;
  code: string;
  /**
   * The guarded reservation status change (and any related writes). It runs
   * inside the SAME transaction as the single-use claim and MUST throw when
   * its optimistic guard (e.g. `updateMany` on the expected status) fails so
   * the whole operation rolls back (the code stays usable for a retry).
   */
  applyStateChange: (tx: Prisma.TransactionClient) => Promise<T>;
  /** Overridable for tests; defaults to the Prisma transaction runner. */
  runner?: (fn: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>;
  /** Overridable store for tests; defaults to the Prisma delegate. */
  store?: ReservationOtpStore;
};

/**
 * Verify a one-time code and apply the state change.
 *
 * Phase 1 (NO transaction): pre-checks and the wrong-attempt counter — these
 * must PERSIST even though the request fails, so they run outside the
 * transaction (a thrown error inside a Prisma interactive transaction would
 * roll the counter back). The increment itself is atomic.
 *
 * Phase 2 (ONE transaction): single-use claim (`consumed`, guarded by
 * `consumed: false` so only one concurrent verify wins) + the caller's
 * guarded state change. If the state change throws, everything rolls back.
 */
export async function consumeReservationOtp<T>(
  params: ConsumeReservationOtpParams<T>,
): Promise<T> {
  const { reservationId, user, stage, code, applyStateChange } = params;
  const store = params.store ?? (db.reservationOtp as unknown as ReservationOtpStore);

  /* ----------------- Phase 1: pre-checks + attempt counter ----------------- */
  const latest = await store.findFirst({
    where: { reservationId, userId: user.id, stage },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    throw new OtpError(
      "کد فعالی برای این مرحله یافت نشد؛ ابتدا کد یک‌بارمصرف را درخواست کنید.",
      410,
    );
  }
  if (latest.consumed) {
    throw new OtpError(
      "این کد قبلاً استفاده شده یا باطل شده است؛ لطفاً کد جدید درخواست کنید.",
      410,
    );
  }
  if (latest.expiresAt.getTime() <= Date.now()) {
    throw new OtpError("کد وارد‌شده منقضی شده است؛ لطفاً کد جدید درخواست کنید.", 410);
  }
  if (latest.attempts >= OTP_MAX_ATTEMPTS) {
    throw new OtpError(
      "این کد به دلیل پنج تلاش ناموفق باطل شده است؛ لطفاً کد جدید درخواست کنید.",
      410,
    );
  }

  if (!verifyOtpHash(normalizeOtpCode(code), latest.codeHash)) {
    // Atomic increment so concurrent wrong attempts cannot be lost.
    await store.updateMany({
      where: { id: latest.id, consumed: false },
      data: { attempts: { increment: 1 } },
    });
    const after = await store.findFirst({
      where: { reservationId, userId: user.id, stage },
      orderBy: { createdAt: "desc" },
    });
    if (after?.consumed) {
      throw new OtpError("این کد قبلاً استفاده شده است؛ کد جدید درخواست کنید.", 410);
    }
    const attempts = after?.attempts ?? OTP_MAX_ATTEMPTS;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      // 5th wrong entry: invalidate the code permanently.
      await store.update({
        where: { id: latest.id },
        data: { consumed: true, consumedAt: new Date() },
      });
      throw new OtpError(
        "تعداد تلاش‌های مجاز به پایان رسید؛ این کد باطل شد. لطفاً کد جدید درخواست کنید.",
        410,
      );
    }
    throw new OtpError(
      `کد وارد‌شده صحیح نیست؛ ${OTP_MAX_ATTEMPTS - attempts} تلاش باقی مانده است.`,
      400,
    );
  }

  /* --------------- Phase 2: claim + state change, one transaction --------------- */
  const runner =
    params.runner ?? ((fn: (tx: Prisma.TransactionClient) => Promise<T>) => db.$transaction(fn));

  return runner(async (tx) => {
    const txStore = tx.reservationOtp as unknown as ReservationOtpStore;
    // Single-use claim: only the first concurrent verify wins this update.
    const claimed = await txStore.updateMany({
      where: { id: latest.id, consumed: false },
      data: { consumed: true },
    });
    if (claimed.count !== 1) {
      throw new OtpError("این کد قبلاً استفاده شده است؛ کد جدید درخواست کنید.", 410);
    }
    await txStore.update({ where: { id: latest.id }, data: { consumedAt: new Date() } });

    // Guarded reservation change inside the same transaction.
    return applyStateChange(tx);
  });
}
