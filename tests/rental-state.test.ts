import {
  assertTransition,
  canAct,
  allowedActions,
  generateReferenceCode,
  RESERVATION_STATUS_LABELS,
  TransitionError,
} from "../src/lib/rental-state";
import { toPersianDigits, faNumber, daysBetween } from "../src/lib/format";

/* ----------------------- rental state machine tests ----------------------- */

describe("rental state machine", () => {
  test("happy path: REQUESTED → … → COMPLETED", () => {
    expect(assertTransition("REQUESTED", "approve")).toBe("APPROVED");
    expect(assertTransition("APPROVED", "confirm_agreement")).toBe("AGREEMENT");
    expect(assertTransition("AGREEMENT", "pay")).toBe("PAYMENT");
    expect(assertTransition("PAYMENT", "pay")).toBe("PAID");
    expect(assertTransition("PAID", "deliver")).toBe("DELIVERED");
    expect(assertTransition("DELIVERED", "request_return")).toBe("RETURNED");
    expect(assertTransition("RETURNED", "confirm_return")).toBe("INSPECTION");
    expect(assertTransition("INSPECTION", "complete_inspection")).toBe(
      "COMPLETED",
    );
  });

  test("invalid jumps are rejected", () => {
    expect(() => assertTransition("REQUESTED", "pay")).toThrow(TransitionError);
    expect(() => assertTransition("REQUESTED", "deliver")).toThrow();
    expect(() => assertTransition("COMPLETED", "cancel")).toThrow();
    expect(() => assertTransition("PAID", "complete_inspection")).toThrow();
  });

  test("cancellation allowed until payment/delivery stages", () => {
    expect(assertTransition("REQUESTED", "cancel")).toBe("CANCELLED");
    expect(assertTransition("AGREEMENT", "cancel")).toBe("CANCELLED");
    expect(assertTransition("PAID", "cancel")).toBe("CANCELLED");
    expect(() => assertTransition("DELIVERED", "cancel")).toThrow();
  });

  test("role permissions: renter cannot approve, host cannot pay", () => {
    expect(canAct("REQUESTED", "approve", "renter")).toBe(false);
    expect(canAct("REQUESTED", "approve", "host")).toBe(true);
    expect(canAct("AGREEMENT", "pay", "renter")).toBe(true);
    expect(canAct("AGREEMENT", "pay", "host")).toBe(false);
    expect(canAct("DISPUTED", "release_deposit", "host")).toBe(true);
    expect(canAct("DISPUTED", "release_deposit", "renter")).toBe(false);
  });

  test("allowedActions lists the actions of the current state", () => {
    const actions = allowedActions("REQUESTED");
    expect(actions).toContain("approve");
    expect(actions).toContain("reject");
    expect(actions).toContain("cancel");
    expect(actions).not.toContain("deliver");
  });

  test("every status has a Persian label", () => {
    for (const s of [
      "REQUESTED",
      "APPROVED",
      "AGREEMENT",
      "PAYMENT",
      "PAID",
      "DELIVERED",
      "RETURNED",
      "INSPECTION",
      "COMPLETED",
      "REJECTED",
      "CANCELLED",
      "DISPUTED",
    ] as const) {
      expect(RESERVATION_STATUS_LABELS[s].length).toBeGreaterThan(2);
    }
  });

  test("reference codes follow the OVR-XXXXX format", () => {
    const code = generateReferenceCode();
    expect(code).toMatch(/^OVR-[A-HJ-NP-Z2-9]{5}$/);
  });
});

/* --------------------------- format helper tests -------------------------- */

describe("format helpers", () => {
  test("Latin digits convert to Persian", () => {
    expect(toPersianDigits("123")).toBe("۱۲۳");
    expect(toPersianDigits(450)).toBe("۴۵۰");
  });

  test("numbers get thousand separators + Persian digits", () => {
    expect(faNumber(450000)).toBe("۴۵۰,۰۰۰");
  });

  test("daysBetween counts inclusive minimum one day", () => {
    const s = new Date("2026-01-01T00:00:00Z");
    const e = new Date("2026-01-04T00:00:00Z");
    expect(daysBetween(s, e)).toBe(3);
    expect(daysBetween(e, s)).toBe(1); // reversed inputs clamp to 1
  });
});

/* --------------------------- parseIntSafe regression --------------------------- */

import { parseIntSafe } from "../src/lib/format";

describe("parseIntSafe", () => {
  test("missing / blank param falls back to the default (Number(null) === 0 bug)", () => {
    expect(parseIntSafe(null, 60)).toBe(60);
    expect(parseIntSafe("", 60)).toBe(60);
    expect(parseIntSafe("   ", 12)).toBe(12);
  });
  test("valid and invalid numeric strings", () => {
    expect(parseIntSafe("5", 60)).toBe(5);
    expect(parseIntSafe("abc", 60)).toBe(60);
  });
});
