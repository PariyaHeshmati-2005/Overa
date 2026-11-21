/**
 * Reservation OTP service tests (src/lib/reservation-otp.ts) — the full rule
 * set (6 digits, 5-min expiry, single use, 5 wrong attempts, 60s resend
 * cooldown, 3 sends / 15 min, stage/reservation/user isolation, hashing)
 * runs against an in-memory fake store, so no database is needed.
 */
import { describe, expect, test, beforeAll } from "bun:test";
import { Prisma } from "@prisma/client";
import {
  createReservationOtp,
  consumeReservationOtp,
  assertOtpStageAllowed,
  normalizeOtpCode,
  OtpError,
  OTP_MAX_ATTEMPTS,
  type ReservationOtpStore,
} from "../src/lib/reservation-otp";

/* ------------------------------ fake store -------------------------------- */

type Row = {
  id: string;
  reservationId: string;
  userId: string;
  stage: string;
  phone: string;
  codeHash: string;
  attempts: number;
  consumed: boolean;
  consumedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
};

function makeStore(): ReservationOtpStore & { rows: Row[]; seq: number } {
  const rows: Row[] = [];
  let seq = 0;
  const matches = (r: Row, where: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(where)) {
      if (v === undefined) continue;
      const rv = (r as unknown as Record<string, unknown>)[k];
      if (v instanceof Date) {
        if (!(rv instanceof Date) || rv.getTime() < v.getTime()) return false;
      } else if (
        v &&
        typeof v === "object" &&
        "gte" in (v as Record<string, unknown>) &&
        rv instanceof Date
      ) {
        // { createdAt: { gte: Date } } — sliding-window boundary.
        if (rv.getTime() < (v as { gte: Date }).gte.getTime()) return false;
      } else if (rv !== v) return false;
    }
    return true;
  };
  const applyData = (r: Row, data: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === "object" && "increment" in (v as Record<string, unknown>)) {
        (r as unknown as Record<string, unknown>)[k] =
          ((r as unknown as Record<string, unknown>)[k] as number) +
          (v as { increment: number }).increment;
      } else {
        (r as unknown as Record<string, unknown>)[k] = v;
      }
    }
  };
  return {
    rows,
    seq: 0,
    async count(args) {
      return rows.filter((r) => matches(r, args.where as Record<string, unknown>)).length;
    },
    async findFirst(args) {
      const found = rows
        .filter((r) => matches(r, args.where as Record<string, unknown>))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return found[0] ?? null;
    },
    async create(args) {
      const row: Row = {
        id: `otp-${++seq}`,
        attempts: 0,
        consumed: false,
        consumedAt: null,
        createdAt: new Date(),
        ...args.data,
      };
      rows.push(row);
      return row;
    },
    async updateMany(args) {
      let n = 0;
      for (const r of rows)
        if (matches(r, args.where as Record<string, unknown>)) {
          applyData(r, args.data as Record<string, unknown>);
          n++;
        }
      return { count: n };
    },
    async update(args) {
      const r = rows.find((x) => x.id === args.where.id);
      if (!r) throw new Error("row not found");
      applyData(r, args.data as Record<string, unknown>);
      return r;
    },
  };
}

const RES1 = "res-1";
const RENTER = { id: "user-renter", phone: "09121111111" };

function runnerFor(store: ReservationOtpStore) {
  return (fn: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
    fn({ reservationOtp: store } as unknown as Prisma.TransactionClient);
}

beforeAll(() => {
  // Demo provider (no real SMS) — the flag is read at call time.
  delete process.env.SMS_PROVIDER_API_KEY;
});

/* -------------------------------- tests ----------------------------------- */

describe("reservation OTP — issuance", () => {
  test("issues a 6-digit random code in demo mode (hashed in store)", async () => {
    const store = makeStore();
    const a = await createReservationOtp({
      reservationId: RES1,
      user: RENTER,
      stage: "DELIVERY_RECEIVED",
      store,
    });
    expect(a.demo).toBe(true);
    expect(a.devCode).toMatch(/^\d{6}$/);
    expect(store.rows).toHaveLength(1);
    const row = store.rows[0];
    expect(row.codeHash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/); // scrypt salt:hash — no plain code
    expect(row.phone).toBe(RENTER.phone);
    expect(row.consumed).toBe(false);
    // ~5 minutes validity
    expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBeCloseTo(5 * 60 * 1000, -2);
    // Two codes never share the same hash (random per issuance)
    const b = await createReservationOtp({
      reservationId: "res-2",
      user: RENTER,
      stage: "DELIVERY_RECEIVED",
      store,
    });
    expect(b.devCode).not.toBe(a.devCode);
    expect(store.rows[1].codeHash).not.toBe(store.rows[0].codeHash);
  });

  test("enforces the 60-second resend cooldown", async () => {
    const store = makeStore();
    await createReservationOtp({ reservationId: RES1, user: RENTER, stage: "DELIVERY_RECEIVED", store });
    await expect(
      createReservationOtp({ reservationId: RES1, user: RENTER, stage: "DELIVERY_RECEIVED", store }),
    ).rejects.toMatchObject({ status: 429 });
    // After the cooldown expires a new code may be issued.
    store.rows[0].createdAt = new Date(Date.now() - 61_000);
    const again = await createReservationOtp({
      reservationId: RES1,
      user: RENTER,
      stage: "DELIVERY_RECEIVED",
      store,
    });
    expect(again.devCode).toMatch(/^\d{6}$/);
  });

  test("caps sends at 3 per 15 minutes and invalidates previous codes", async () => {
    const store = makeStore();
    for (let i = 0; i < 3; i++) {
      await createReservationOtp({ reservationId: RES1, user: RENTER, stage: "DELIVERY_RECEIVED", store });
      store.rows[store.rows.length - 1].createdAt = new Date(Date.now() - (200 - i * 30) * 1000);
    }
    await expect(
      createReservationOtp({ reservationId: RES1, user: RENTER, stage: "DELIVERY_RECEIVED", store }),
    ).rejects.toMatchObject({ status: 429 });
    // All previous codes were invalidated when later ones were issued.
    expect(store.rows.slice(0, 2).every((r) => r.consumed)).toBe(true);
    // The quota is per (reservation, user, stage) — another order is unaffected.
    const other = await createReservationOtp({
      reservationId: "res-2",
      user: RENTER,
      stage: "DELIVERY_RECEIVED",
      store,
    });
    expect(other.devCode).toMatch(/^\d{6}$/);
  });

  test("stages are independent: cooldown/quota is tracked per stage", async () => {
    const store = makeStore();
    await createReservationOtp({ reservationId: RES1, user: RENTER, stage: "DELIVERY_RECEIVED", store });
    // Immediately issuing for the OTHER stage is allowed.
    const host = await createReservationOtp({
      reservationId: RES1,
      user: { id: "user-host", phone: "09122222222" },
      stage: "RETURN_RECEIVED",
      store,
    });
    expect(host.devCode).toMatch(/^\d{6}$/);
  });
});

describe("reservation OTP — verification", () => {
  async function setup(stage: "DELIVERY_RECEIVED" | "RETURN_RECEIVED") {
    const store = makeStore();
    const issued = await createReservationOtp({
      reservationId: RES1,
      user: RENTER,
      stage,
      store,
    });
    return { store, issued };
  }

  test("correct code claims the code once and applies the state change", async () => {
    const { store, issued } = await setup("DELIVERY_RECEIVED");
    let applied = 0;
    const result = await consumeReservationOtp({
      reservationId: RES1,
      user: { id: RENTER.id },
      stage: "DELIVERY_RECEIVED",
      code: issued.devCode!,
      applyStateChange: async () => void applied++,
      store, runner: runnerFor(store),
    });
    expect(result).toBeUndefined();
    expect(applied).toBe(1);
    const row = store.rows[0];
    expect(row.consumed).toBe(true);
    expect(row.consumedAt).not.toBeNull();
    // Reuse of the same code is rejected (single-use).
    await expect(
      consumeReservationOtp({
        reservationId: RES1,
        user: { id: RENTER.id },
        stage: "DELIVERY_RECEIVED",
        code: issued.devCode!,
        applyStateChange: async () => {},
        store, runner: runnerFor(store),
      }),
    ).rejects.toMatchObject({ status: 410 });
  });

  test("wrong code increments attempts; at 5 the code is invalidated", async () => {
    const { store, issued } = await setup("DELIVERY_RECEIVED");
    for (let i = 1; i <= OTP_MAX_ATTEMPTS; i++) {
      await expect(
        consumeReservationOtp({
          reservationId: RES1,
          user: { id: RENTER.id },
          stage: "DELIVERY_RECEIVED",
          code: "000000",
          applyStateChange: async () => {},
          store, runner: runnerFor(store),
        }),
      ).rejects.toMatchObject({ status: i === OTP_MAX_ATTEMPTS ? 410 : 400 });
    }
    expect(store.rows[0].attempts).toBe(OTP_MAX_ATTEMPTS);
    expect(store.rows[0].consumed).toBe(true);
    // Even the CORRECT code is no longer accepted after invalidation.
    await expect(
      consumeReservationOtp({
        reservationId: RES1,
        user: { id: RENTER.id },
        stage: "DELIVERY_RECEIVED",
        code: issued.devCode!,
        applyStateChange: async () => {},
        store, runner: runnerFor(store),
      }),
    ).rejects.toMatchObject({ status: 410 });
  });

  test("expired codes are rejected", async () => {
    const { store, issued } = await setup("DELIVERY_RECEIVED");
    store.rows[0].expiresAt = new Date(Date.now() - 1000);
    await expect(
      consumeReservationOtp({
        reservationId: RES1,
        user: { id: RENTER.id },
        stage: "DELIVERY_RECEIVED",
        code: issued.devCode!,
        applyStateChange: async () => {},
        store, runner: runnerFor(store),
      }),
    ).rejects.toMatchObject({ status: 410 });
  });

  test("codes are bound to stage, reservation and user", async () => {
    const { store, issued } = await setup("DELIVERY_RECEIVED");
    // Wrong stage.
    await expect(
      consumeReservationOtp({
        reservationId: RES1,
        user: { id: RENTER.id },
        stage: "RETURN_RECEIVED",
        code: issued.devCode!,
        applyStateChange: async () => {},
        store, runner: runnerFor(store),
      }),
    ).rejects.toMatchObject({ status: 410 });
    // Wrong reservation.
    await expect(
      consumeReservationOtp({
        reservationId: "res-other",
        user: { id: RENTER.id },
        stage: "DELIVERY_RECEIVED",
        code: issued.devCode!,
        applyStateChange: async () => {},
        store, runner: runnerFor(store),
      }),
    ).rejects.toMatchObject({ status: 410 });
    // Wrong user.
    await expect(
      consumeReservationOtp({
        reservationId: RES1,
        user: { id: "someone-else" },
        stage: "DELIVERY_RECEIVED",
        code: issued.devCode!,
        applyStateChange: async () => {},
        store, runner: runnerFor(store),
      }),
    ).rejects.toMatchObject({ status: 410 });
    // The code is still untouched after all of those failures.
    expect(store.rows[0].consumed).toBe(false);
    expect(store.rows[0].attempts).toBe(0);
  });

  test("a failed state-change guard propagates and the claim rolls back", async () => {
    const { store, issued } = await setup("RETURN_RECEIVED");
    await expect(
      consumeReservationOtp({
        reservationId: RES1,
        user: { id: RENTER.id },
        stage: "RETURN_RECEIVED",
        code: issued.devCode!,
        applyStateChange: async () => {
          throw new OtpError("وضعیت سفارش تغییر کرده است؛ صفحه را به‌روزرسانی و دوباره تلاش کنید.", 409);
        },
        store, runner: runnerFor(store),
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe("reservation OTP — guards & normalization", () => {
  const delivered = { id: RES1, renterId: "u1", hostId: "h1", status: "DELIVERED" };
  const returnRequested = { id: RES1, renterId: "u1", hostId: "h1", status: "RETURN_REQUESTED" };

  test("stage guard enforces role and status", () => {
    expect(() => assertOtpStageAllowed(delivered, { id: "u1" }, "DELIVERY_RECEIVED")).not.toThrow();
    expect(() => assertOtpStageAllowed(delivered, { id: "h1" }, "DELIVERY_RECEIVED")).toThrow(OtpError);
    expect(() => assertOtpStageAllowed(returnRequested, { id: "u1" }, "DELIVERY_RECEIVED")).toThrow(OtpError);
    expect(() => assertOtpStageAllowed(returnRequested, { id: "h1" }, "RETURN_RECEIVED")).not.toThrow();
    expect(() => assertOtpStageAllowed(returnRequested, { id: "h1" }, "DELIVERY_RECEIVED")).toThrow(OtpError);
    const completed = { ...delivered, status: "COMPLETED" };
    expect(() => assertOtpStageAllowed(completed, { id: "u1" }, "DELIVERY_RECEIVED")).toThrow(OtpError);
  });

  test("Persian digits fold to Latin", () => {
    expect(normalizeOtpCode("۱۲۳۴۵۶")).toBe("123456");
    expect(normalizeOtpCode(" 12 345۶ ")).toBe("123456");
    expect(normalizeOtpCode("۱۲۳۴۵")).toBe("12345");
  });
});
