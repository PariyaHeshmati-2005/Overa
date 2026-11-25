import {
  assertTransition,
  canAct,
  allowedActions,
  generateReferenceCode,
  RESERVATION_STATUS_LABELS,
  DEPOSIT_STATUS_LABELS,
  OTP_ONLY_ACTIONS,
  OTP_STAGE_BY_STATUS,
  TransitionError,
} from "../src/lib/rental-state";
import { toPersianDigits, faNumber, daysBetween, faCountWord } from "../src/lib/format";

/* ----------------------- rental state machine tests ----------------------- */

describe("rental state machine", () => {
  test("happy path: REQUESTED → … → COMPLETED (two-sided OTP flow)", () => {
    expect(assertTransition("REQUESTED", "approve")).toBe("APPROVED");
    expect(assertTransition("APPROVED", "confirm_agreement")).toBe("AGREEMENT");
    expect(assertTransition("AGREEMENT", "pay")).toBe("PAYMENT");
    expect(assertTransition("PAYMENT", "pay")).toBe("PAID");
    expect(assertTransition("PAID", "deliver")).toBe("DELIVERED");
    // Host recorded the hand-over → renter OTP-confirms receipt → active.
    expect(assertTransition("DELIVERED", "confirm_delivery")).toBe("RENTAL_ACTIVE");
    // Renter announces the return → host OTP-confirms healthy return.
    expect(assertTransition("RENTAL_ACTIVE", "request_return")).toBe("RETURN_REQUESTED");
    expect(assertTransition("RETURN_REQUESTED", "confirm_return")).toBe("COMPLETED");
  });

  test("legacy path kept for pre-OTP data: RETURNED → INSPECTION → COMPLETED", () => {
    expect(assertTransition("RETURNED", "confirm_return")).toBe("INSPECTION");
    expect(assertTransition("INSPECTION", "complete_inspection")).toBe("COMPLETED");
  });

  test("refuse_delivery: renter voids the order at the DELIVERED stage", () => {
    // DELIVERED --refuse_delivery--> CANCELLED (damage found on arrival).
    expect(assertTransition("DELIVERED", "refuse_delivery")).toBe("CANCELLED");
    // Renter-only action…
    expect(canAct("DELIVERED", "refuse_delivery", "renter")).toBe(true);
    // …the host and the admin can never refuse on the renter's behalf.
    expect(canAct("DELIVERED", "refuse_delivery", "host")).toBe(false);
    expect(canAct("DELIVERED", "refuse_delivery", "admin")).toBe(false);
    // And it is impossible anywhere else in the lifecycle.
    expect(canAct("PAID", "refuse_delivery", "renter")).toBe(false);
    expect(canAct("RENTAL_ACTIVE", "refuse_delivery", "renter")).toBe(false);
    expect(() => assertTransition("RENTAL_ACTIVE", "refuse_delivery")).toThrow(
      TransitionError,
    );
  });

  test("invalid jumps are rejected", () => {
    expect(() => assertTransition("REQUESTED", "pay")).toThrow(TransitionError);
    expect(() => assertTransition("REQUESTED", "deliver")).toThrow();
    expect(() => assertTransition("COMPLETED", "cancel")).toThrow();
    expect(() => assertTransition("PAID", "complete_inspection")).toThrow();
  });

  test("renter cannot announce a return before the rental is active", () => {
    expect(() => assertTransition("DELIVERED", "request_return")).toThrow(TransitionError);
    expect(() => assertTransition("PAID", "request_return")).toThrow(TransitionError);
    expect(canAct("DELIVERED", "request_return", "renter")).toBe(false);
    expect(canAct("RENTAL_ACTIVE", "request_return", "renter")).toBe(true);
  });

  test("delivery confirmation is renter-only and return confirmation host-only", () => {
    expect(canAct("DELIVERED", "confirm_delivery", "renter")).toBe(true);
    expect(canAct("DELIVERED", "confirm_delivery", "host")).toBe(false);
    expect(canAct("RETURN_REQUESTED", "confirm_return", "host")).toBe(true);
    expect(canAct("RETURN_REQUESTED", "confirm_return", "renter")).toBe(false);
    expect(canAct("COMPLETED", "confirm_return", "host")).toBe(false);
  });

  test("OTP-only actions are declared and stage-bound", () => {
    expect(OTP_ONLY_ACTIONS).toContain("confirm_delivery");
    expect(OTP_STAGE_BY_STATUS["DELIVERED"]).toBe("DELIVERY_RECEIVED");
    expect(OTP_STAGE_BY_STATUS["RETURN_REQUESTED"]).toBe("RETURN_RECEIVED");
    expect(OTP_STAGE_BY_STATUS["RENTAL_ACTIVE"]).toBeUndefined();
  });

  test("host declares damage at the return stage; disputes are admin-settled", () => {
    // RETURN_REQUESTED --declare_damage--> DISPUTED (host-only action).
    expect(assertTransition("RETURN_REQUESTED", "declare_damage")).toBe("DISPUTED");
    expect(canAct("RETURN_REQUESTED", "declare_damage", "host")).toBe(true);
    expect(canAct("RETURN_REQUESTED", "declare_damage", "renter")).toBe(false);
    // Mid-rental dispute stays available to both sides…
    expect(assertTransition("RENTAL_ACTIVE", "dispute")).toBe("DISPUTED");
    // …but DISPUTED is a hold state: the settlement runs ONLY through the
    // admin «اعلام خسارت‌ها» pipeline (/api/admin/claims), not the machine.
    expect(canAct("DISPUTED", "release_deposit", "host")).toBe(false);
    expect(canAct("DISPUTED", "release_deposit", "renter")).toBe(false);
    expect(canAct("DISPUTED", "confirm_return", "host")).toBe(false);
    expect(canAct("DISPUTED", "complete_inspection", "host")).toBe(false);
    expect(allowedActions("DISPUTED")).toHaveLength(0);
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
  });

  test("allowedActions lists the actions of the current state", () => {
    const actions = allowedActions("REQUESTED");
    expect(actions).toContain("approve");
    expect(actions).toContain("reject");
    expect(actions).toContain("cancel");
    expect(actions).not.toContain("deliver");
    const delivered = allowedActions("DELIVERED");
    expect(delivered).toContain("confirm_delivery");
    expect(delivered).not.toContain("request_return");
    expect(allowedActions("RETURN_REQUESTED")).toContain("confirm_return");
  });

  test("every status has a Persian label", () => {
    for (const s of [
      "REQUESTED",
      "APPROVED",
      "AGREEMENT",
      "PAYMENT",
      "PAID",
      "DELIVERED",
      "RENTAL_ACTIVE",
      "RETURN_REQUESTED",
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

  test("deposit pipeline labels exist", () => {
    expect(DEPOSIT_STATUS_LABELS["REFUND_PENDING"].length).toBeGreaterThan(2);
    expect(DEPOSIT_STATUS_LABELS["REFUNDED"].length).toBeGreaterThan(2);
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

  test("faCountWord spells counters in Persian words, then digits", () => {
    expect(faCountWord(1)).toBe("یک");
    expect(faCountWord(2)).toBe("دو");
    expect(faCountWord(20)).toBe("بیست");
    expect(faCountWord(21)).toBe("۲۱");
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
