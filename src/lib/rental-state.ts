/**
 * Overa rental / reservation state machine.
 *
 * Canonical states map the labels used across the original source pages
 * (rental-lifecycle.html, rentals.html, host-dashboard.html). Every status
 * change must go through `assertTransition` — arbitrary state jumps from the
 * client are rejected by the API.
 */
import crypto from "node:crypto";


export type ReservationStatus =
  | "REQUESTED"
  | "APPROVED"
  | "AGREEMENT"
  | "PAYMENT"
  | "PAID"
  | "DELIVERED"
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
  DELIVERED: "تحویل داده شد — در حال استفاده",
  RETURNED: "بازگشت داده شد — در انتظار بازبینی",
  INSPECTION: "در حال تکمیل صورت‌جلسه تحویل",
  COMPLETED: "اجاره تکمیل شد",
  REJECTED: "درخواست رد شد",
  CANCELLED: "لغو شده",
  DISPUTED: "دارای اختلاف / اعلام خسارت",
};

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  REQUESTED: "bg-accent-gold/15 text-accent-gold",
  APPROVED: "bg-primary-soft text-primary",
  AGREEMENT: "bg-primary-soft text-primary",
  PAYMENT: "bg-accent-gold/15 text-accent-gold",
  PAID: "bg-accent-emerald/15 text-accent-emerald",
  DELIVERED: "bg-primary-soft text-primary",
  RETURNED: "bg-neutral-muted/15 text-neutral-muted",
  INSPECTION: "bg-accent-gold/15 text-accent-gold",
  COMPLETED: "bg-accent-emerald/15 text-accent-emerald",
  REJECTED: "bg-red-100 text-red-600",
  CANCELLED: "bg-neutral-muted/15 text-neutral-muted",
  DISPUTED: "bg-red-100 text-red-600",
};

export type ReservationAction =
  | "approve"
  | "reject"
  | "confirm_agreement"
  | "pay"
  | "deliver"
  | "request_return"
  | "confirm_return"
  | "complete_inspection"
  | "release_deposit"
  | "dispute"
  | "cancel";

/** Which side (renter / host / admin) may perform each action. */
export const ACTION_ACTORS: Record<ReservationAction, ("renter" | "host" | "admin")[]> = {
  approve: ["host"],
  reject: ["host"],
  confirm_agreement: ["renter"],
  pay: ["renter"],
  deliver: ["host"],
  request_return: ["renter"],
  confirm_return: ["host"],
  complete_inspection: ["renter", "host"],
  release_deposit: ["host"],
  dispute: ["renter", "host"],
  cancel: ["renter", "host"],
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
    pay: "PAID",
    cancel: "CANCELLED",
  },
  PAID: {
    deliver: "DELIVERED",
    cancel: "CANCELLED",
  },
  DELIVERED: {
    request_return: "RETURNED",
    dispute: "DISPUTED",
  },
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
  DISPUTED: {
    release_deposit: "COMPLETED",
  },
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
