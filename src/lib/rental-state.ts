/**
 * Overa rental / reservation state machine.
 *
 * Canonical states map the labels used across the original source pages
 * (rental-lifecycle.html, rentals.html, host-dashboard.html). Every status
 * change must go through `assertTransition` — arbitrary state jumps from the
 * client are rejected by the API.
 *
 * Two-sided OTP confirmation flow (DELIVERED → RENTAL_ACTIVE →
 * RETURN_REQUESTED → COMPLETED): `confirm_delivery` is renter-only and
 * `confirm_return` from RETURN_REQUESTED is host-only, and both may ONLY be
 * executed through the OTP flow (src/lib/reservation-otp.ts + the
 * /api/reservations/[id]/otp/* routes) — never through the generic PATCH
 * endpoint. RETURNED → INSPECTION remains for legacy reservations created
 * before the OTP flow existed.
 *
 * Money flow (sandbox): the DEPOSIT (ودیعه) is charged at the pay stage
 * (before the item is handed over and before the renter's «سلامت تحویل
 * گرفتم» confirmation); the DAILY-RATE rent (days × dailyPrice) is charged
 * only AFTER the renter confirms receipt (→ RENTAL_ACTIVE). On a healthy
 * return the deposit is released automatically to the renter's wallet; on a
 * declared damage the order goes to DISPUTED and ONLY the admin dashboard
 * («اعلام خسارت‌ها») settles it with a percent ruling (chat + verdict within
 * one week). `refuse_delivery` voids the order and releases the deposit back
 * to the renter's wallet.
 */
import crypto from "node:crypto";


export type ReservationStatus =
  | "REQUESTED"
  | "APPROVED"
  | "AGREEMENT"
  | "PAYMENT"
  | "PAID"
  | "DELIVERED"
  | "RENTAL_ACTIVE"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "INSPECTION"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "DISPUTED";

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  REQUESTED: "در انتظار پاسخ مالک",
  APPROVED: "تایید مالک — در انتظار قرارداد",
  AGREEMENT: "قرارداد تایید شد — در انتظار پرداخت",
  PAYMENT: "در حال پرداخت",
  PAID: "پرداخت انجام شد — در انتظار تحویل",
  DELIVERED: "تحویل ثبت شد — در انتظار تأیید دریافت مستأجر",
  RENTAL_ACTIVE: "اجاره فعال — در حال استفاده",
  RETURN_REQUESTED: "بازگشت ثبت شد — در انتظار تأیید میزبان",
  RETURNED: "بازگشت داده شد — در انتظار بازبینی",
  INSPECTION: "در حال تکمیل صورت‌جلسه تحویل",
  COMPLETED: "اجاره تکمیل شد",
  REJECTED: "درخواست رد شد",
  CANCELLED: "لغو شده",
  DISPUTED: "در حال بررسی خسارت توسط کارشناسان اٌوِرا",
};

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  REQUESTED: "bg-accent-gold/15 text-accent-gold",
  APPROVED: "bg-primary-soft text-primary",
  AGREEMENT: "bg-primary-soft text-primary",
  PAYMENT: "bg-accent-gold/15 text-accent-gold",
  PAID: "bg-accent-emerald/15 text-accent-emerald",
  DELIVERED: "bg-primary-soft text-primary",
  RENTAL_ACTIVE: "bg-accent-emerald/15 text-accent-emerald",
  RETURN_REQUESTED: "bg-accent-gold/15 text-accent-gold",
  RETURNED: "bg-neutral-muted/15 text-neutral-muted",
  INSPECTION: "bg-accent-gold/15 text-accent-gold",
  COMPLETED: "bg-accent-emerald/15 text-accent-emerald",
  REJECTED: "bg-red-100 text-red-600",
  CANCELLED: "bg-neutral-muted/15 text-neutral-muted",
  DISPUTED: "bg-red-100 text-red-600",
};

/** Deposit refund pipeline states (Reservation.depositStatus, sandbox ledger). */
export type DepositStatus = "NONE" | "HELD" | "REFUND_PENDING" | "REFUNDED";

export const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
  NONE: "ودیعه‌ای ثبت نشده است",
  HELD: "ودیعه بلوکه شده است",
  REFUND_PENDING: "فرآیند بازگشت ودیعه آغاز شده است",
  REFUNDED: "ودیعه مسترد شد",
};

export type ReservationAction =
  | "approve"
  | "reject"
  | "confirm_agreement"
  | "pay"
  | "deliver"
  | "confirm_delivery"
  | "request_return"
  | "confirm_return"
  | "complete_inspection"
  | "declare_damage"
  | "dispute"
  | "refuse_delivery"
  | "cancel";

/** Which side (renter / host / admin) may perform each action. */
export const ACTION_ACTORS: Record<ReservationAction, ("renter" | "host" | "admin")[]> = {
  approve: ["host"],
  reject: ["host"],
  confirm_agreement: ["renter"],
  pay: ["renter"],
  deliver: ["host"],
  confirm_delivery: ["renter"],
  request_return: ["renter"],
  confirm_return: ["host"],
  complete_inspection: ["renter", "host"],
  // Host declares damage at the RETURN stage: the order goes to DISPUTED and
  // the case lands in the admin dashboard's «اعلام خسارت‌ها» queue where the
  // admin chats with the renter and issues the deposit-split ruling.
  declare_damage: ["host"],
  dispute: ["renter", "host"],
  // Renter refuses the item AT DELIVERY (damage found on arrival / non-delivery):
  // the whole order is stopped, the deposit flows back to the renter's wallet
  // and a failed-rental comment is recorded on the host's reviews.
  refuse_delivery: ["renter"],
  cancel: ["renter", "host"],
};

/**
 * Actions that may ONLY be executed through the OTP flow
 * (POST /api/reservations/[id]/otp/verify). The generic PATCH endpoint must
 * reject them so no state change can happen without a verified one-time code.
 */
export const OTP_ONLY_ACTIONS: ReservationAction[] = ["confirm_delivery"];

/** OTP stage bound to each status that requires a verified one-time code. */
export type ReservationOtpStage =
  | "DELIVERY_RECEIVED"
  | "RETURN_RECEIVED"
  // Digital contract signature: RENTER only (the host never signs — their
  // approval is the plain state-machine action). Verifiable while the order
  // sits in REQUESTED or APPROVED; see reservation-otp.ts.
  | "AGREEMENT_SIGNATURE";

export const OTP_STAGE_BY_STATUS: Partial<Record<ReservationStatus, ReservationOtpStage>> = {
  DELIVERED: "DELIVERY_RECEIVED", // renter confirms receipt → RENTAL_ACTIVE
  RETURN_REQUESTED: "RETURN_RECEIVED", // host confirms healthy return → COMPLETED
};

const TRANSITIONS: Record<ReservationStatus, Partial<Record<ReservationAction, ReservationStatus>>> = {
  REQUESTED: {
    approve: "APPROVED",
    reject: "REJECTED",
    cancel: "CANCELLED",
  },
  APPROVED: {
    confirm_agreement: "AGREEMENT",
    reject: "REJECTED",
    cancel: "CANCELLED",
  },
  AGREEMENT: {
    pay: "PAYMENT",
    cancel: "CANCELLED",
  },
  PAYMENT: {
    // Completing the payment now charges the DEPOSIT (ودیعه) only — the rent
    // is charged after the renter's receipt confirmation (see DELIVERY stage).
    pay: "PAID",
    cancel: "CANCELLED",
  },
  PAID: {
    deliver: "DELIVERED",
    cancel: "CANCELLED",
  },
  // Host recorded the hand-over; the rental only becomes active after the
  // renter verifies receipt with a one-time code (OTP flow). The deposit has
  // already been escrowed at the pay stage (before this confirmation).
  DELIVERED: {
    confirm_delivery: "RENTAL_ACTIVE",
    // Renter found the item damaged on arrival and refuses the hand-over:
    // the order is voided entirely, the deposit is released back to the
    // renter's wallet and a failed-rental comment is recorded on the host.
    refuse_delivery: "CANCELLED",
  },
  RENTAL_ACTIVE: {
    request_return: "RETURN_REQUESTED",
    // Mid-rental damage/dispute (item broke during the rental): the order
    // goes to the admin dashboard's «اعلام خسارت‌ها» queue.
    dispute: "DISPUTED",
  },
  // Renter announced the return; the host either OTP-confirms a healthy
  // return (→ COMPLETED + automatic deposit release) or declares damage
  // (declare_damage → DISPUTED, handled by the admin dashboard).
  RETURN_REQUESTED: {
    confirm_return: "COMPLETED",
    declare_damage: "DISPUTED",
  },
  // Legacy path kept for reservations created before the OTP flow existed.
  RETURNED: {
    confirm_return: "INSPECTION",
    dispute: "DISPUTED",
  },
  INSPECTION: {
    complete_inspection: "COMPLETED",
    dispute: "DISPUTED",
  },
  COMPLETED: {},
  REJECTED: {},
  CANCELLED: {},
  // The dispute is settled ONLY from the admin dashboard's «اعلام خسارت‌ها»
  // section (percent ruling on the deposit, executed by /api/admin/claims).
  DISPUTED: {},
};

export class TransitionError extends Error {}

export function assertTransition(
  from: ReservationStatus,
  action: ReservationAction,
): ReservationStatus {
  const next = TRANSITIONS[from]?.[action];
  if (!next) {
    throw new TransitionError(
      `انتقال وضعیت مجاز نیست: از «${RESERVATION_STATUS_LABELS[from]}» با کنش «${action}»`,
    );
  }
  return next;
}

export function allowedActions(status: ReservationStatus): ReservationAction[] {
  return Object.keys(TRANSITIONS[status] ?? {}) as ReservationAction[];
}

export function canAct(
  status: ReservationStatus,
  action: ReservationAction,
  actor: "renter" | "host" | "admin",
): boolean {
  if (!ACTION_ACTORS[action]?.includes(actor)) return false;
  return Boolean(TRANSITIONS[status]?.[action]);
}

/** Generate a rental reference code: OVR-XXXXX (collision-safe, per playbook). */
export function generateReferenceCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(5);
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return `OVR-${code}`;
}
