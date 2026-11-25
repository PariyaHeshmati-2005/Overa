/**
 * Date-aware rental reminders (delivery day + return deadline).
 *
 * The reservation stores exact calendar dates (UTC midnight of the picked
 * Jalali day). This module turns those stored dates into proactive
 * notifications so the renter (and the host) never lose track of WHEN the
 * item must be handed back:
 *
 *   - Upcoming delivery (status PAID / DELIVERED): 2 days, 1 day and on the
 *     delivery day itself. If the delivery day has passed and the host still
 *     has not recorded the hand-over («PAID»), both sides get a daily nudge.
 *   - Return deadline (status RENTAL_ACTIVE): 2 days before, 1 day before and
 *     on the deadline day itself. After the deadline every day without a
 *     registered return produces a "late return — day N" reminder for both
 *     the renter (return it now) and the host (declare damage if needed).
 *
 * Deduplication: reminder titles are deterministic per (reservation, stage,
 * day) — e.g. the overdue title carries the Persian day counter — and a
 * reminder is only created when no Notification with the same userId+type+
 * title exists. Re-running the sweep is therefore always safe.
 *
 * The sweep is wrapped in `maybeRunRentalReminderSweep` which throttles it to
 * at most one run per minute per server process; it is invoked from the two
 * endpoints the UI already polls (GET /api/notifications and
 * GET /api/reservations), so no background worker is required. For a real
 * cron deployment `bun run reminders` (scripts/run-reminders.ts) runs one
 * full sweep on demand. All failures are swallowed — reminders must never
 * break the endpoint that triggered them.
 */
import { db } from "@/lib/db";
import { diffDaysIso, formatJalaliIso, todayIsoTehran } from "@/lib/jalali";

/** Reservation statuses whose stored dates drive reminders. */
export const REMINDER_STATUSES = ["PAID", "DELIVERED", "RENTAL_ACTIVE"] as const;

type SweepReservation = {
  id: string;
  code: string;
  status: string;
  startDate: Date;
  endDate: Date;
  renterId: string;
  hostId: string;
  listing: { title: string };
};

/** Minimal store surface (the Prisma delegate or a test fake). */
export interface ReminderStore {
  reservation: {
    findMany(args: {
      where: { status: { in: readonly string[] } };
    }): Promise<SweepReservation[]>;
  };
  notification: {
    findFirst(args: {
      where: { userId: string; type: string; title: string };
    }): Promise<unknown | null>;
    create(args: {
      data: {
        userId: string;
        type: string;
        title: string;
        body: string;
        link?: string | null;
      };
    }): Promise<unknown>;
  };
}

/** ۳ → "۳" — Persian digit rendering for day counters. */
function faNum(n: number): string {
  return n.toLocaleString("fa-IR");
}

type Side = "renter" | "host";

async function pushReminder(
  store: ReminderStore,
  r: SweepReservation,
  side: Side,
  title: string,
  body: string,
): Promise<boolean> {
  const userId = side === "renter" ? r.renterId : r.hostId;
  // Deterministic title per (reservation, stage, day) → exact dedupe.
  const existing = await store.notification.findFirst({
    where: { userId, type: "REMINDER", title },
  });
  if (existing) return false;
  await store.notification.create({
    data: {
      userId,
      type: "REMINDER",
      title,
      body,
      link: side === "renter" ? "/rentals" : "/host-dashboard",
    },
  });
  return true;
}

/** One full sweep. Returns how many reservations were checked and how many new reminders were written. */
export async function runRentalReminderSweep(
  now: Date = new Date(),
  store: ReminderStore = db as unknown as ReminderStore,
): Promise<{ checked: number; created: number }> {
  const today = todayIsoTehran(now);
  const reservations = await store.reservation.findMany({
    where: { status: { in: REMINDER_STATUSES } },
  });
  let created = 0;

  for (const r of reservations) {
    // Dates are stored as UTC midnight of the picked calendar day, so the
    // ISO slice IS the picked Jalali day — no timezone drift.
    const startIso = r.startDate.toISOString().slice(0, 10);
    const endIso = r.endDate.toISOString().slice(0, 10);
    const deadline = formatJalaliIso(endIso);
    const start = formatJalaliIso(startIso);

    if (r.status === "PAID" || r.status === "DELIVERED") {
      const daysToStart = diffDaysIso(today, startIso); // >0: in the future
      if (daysToStart === 2 || daysToStart === 1 || daysToStart === 0) {
        const when =
          daysToStart === 2 ? "دو روز دیگر" : daysToStart === 1 ? "فردا" : "امروز";
        const baseTitle = `${when} روز تحویل کالاست — «${r.code}»`;
        if (
          await pushReminder(
            store,
            r,
            "renter",
            baseTitle,
            `تحویل «${r.listing.title}» ${when} (${start}) انجام می‌شود؛ آمادهٔ دریافت کالا باشید و کد تأیید دریافت را در صفحهٔ اجاره تکمیل کنید.`,
          )
        )
          created++;
        if (
          await pushReminder(
            store,
            r,
            "host",
            baseTitle,
            `تحویل «${r.listing.title}» به مستأجر ${when} (${start}) است؛ پس از تحویل، آن را از پنل میزبان ثبت کنید.`,
          )
        )
          created++;
      } else if (daysToStart < 0 && r.status === "PAID") {
        const late = faNum(Math.abs(daysToStart));
        const title = `روز تحویل کالا گذشته است — «${r.code}» (روز ${late})`;
        if (
          await pushReminder(
            store,
            r,
            "renter",
            title,
            `روز تحویل «${r.listing.title}» (${start}) گذشته و تحویل هنوز ثبت نشده است؛ با میزبان در تماس باشید یا سفارش را لغو کنید.`,
          )
        )
          created++;
        if (
          await pushReminder(
            store,
            r,
            "host",
            title,
            `روز تحویل «${r.listing.title}» به مستأجر گذشته است؛ لطفاً تحویل را در پنل میزبان ثبت کنید یا سفارش را پیگیری کنید.`,
          )
        )
          created++;
      }
    } else {
      // RENTAL_ACTIVE — count down to the stored return deadline.
      const daysLeft = diffDaysIso(today, endIso); // >0: days still remaining
      if (daysLeft === 2 || daysLeft === 1 || daysLeft === 0) {
        const when =
          daysLeft === 2 ? "دو روز دیگر" : daysLeft === 1 ? "فردا" : "امروز";
        const baseTitle =
          daysLeft === 0
            ? `امروز مهلت بازگشت کالاست — «${r.code}»`
            : `${when} مهلت بازگشت کالاست — «${r.code}»`;
        if (
          await pushReminder(
            store,
            r,
            "renter",
            baseTitle,
            `مهلت عودت «${r.listing.title}» ${deadline} است؛ ${when === "امروز" ? "وسیله را آمادهٔ تحویل کنید و از صفحهٔ همین اجاره «درخواست بازگشت» را ثبت کنید." : `${when} آخرین روز نگهداری وسیله است، برنامهٔ بازگشت را بچینید.`}`,
          )
        )
          created++;
        if (
          await pushReminder(
            store,
            r,
            "host",
            baseTitle,
            `مهلت بازگشت «${r.listing.title}» ${deadline} است (${when === "امروز" ? "همین امروز" : when})؛ پس از ثبت بازگشت توسط مستأجر، سلامت کالا را با کد یک‌بارمصرف تأیید کنید.`,
          )
        )
          created++;
      } else if (daysLeft < 0) {
        const late = faNum(Math.abs(daysLeft));
        const title = `تأخیر در بازگشت کالا — «${r.code}» (روز ${late})`;
        if (
          await pushReminder(
            store,
            r,
            "renter",
            title,
            `مهلت عودت «${r.listing.title}» (${deadline}) گذشته است؛ فوراً از صفحهٔ اجاره «درخواست بازگشت» را ثبت کنید یا با میزبان هماهنگ کنید تا اختلاف ثبت نشود.`,
          )
        )
          created++;
        if (
          await pushReminder(
            store,
            r,
            "host",
            title,
            `مستأجر «${r.listing.title}» را در روز مقرر (${deadline}) بازگشت نداده است؛ در صورت عدم هماهنگی، موضوع از طریق پشتیبانی اٌوِرا پیگیری می‌شود.`,
          )
        )
          created++;
      }
    }
  }
  return { checked: reservations.length, created };
}

/* ------------------------- opportunistic trigger --------------------------- */

const SWEEP_MIN_INTERVAL_MS = 60_000;
let lastFinishedAt = 0;
let inFlight: Promise<void> | null = null;

/**
 * Run the sweep at most once per minute per server process; safe to await
 * from any endpoint (never throws). Called from GET /api/notifications and
 * GET /api/reservations — the endpoints the UI already polls.
 */
export function maybeRunRentalReminderSweep(): Promise<void> {
  if (Date.now() - lastFinishedAt < SWEEP_MIN_INTERVAL_MS) return Promise.resolve();
  if (inFlight) return inFlight;
  inFlight = runRentalReminderSweep()
    .then(() => {
      lastFinishedAt = Date.now();
    })
    .catch(() => {
      // Reminders are best-effort; a failed sweep retries on the next poll.
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
