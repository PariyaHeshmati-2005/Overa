import { describe, expect, test } from "bun:test";
import {
  runRentalReminderSweep,
  type ReminderStore,
  type SweepReservation,
} from "../src/lib/rental-reminders";

/** Fixed "today": 2026-03-10 in Tehran (UTC+3:30, no DST since 2022). */
const NOW = new Date("2026-03-10T12:00:00.000Z");

type WrittenNotification = {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
};

/** In-memory reminder store; second return value exposes what was written. */
function makeStore(reservations: SweepReservation[]) {
  const notifications: WrittenNotification[] = [];
  const store: ReminderStore = {
    reservation: {
      findMany: async () => reservations,
    },
    notification: {
      findFirst: async (args) =>
        notifications.find(
          (n) =>
            n.userId === args.where.userId &&
            n.type === args.where.type &&
            n.title === args.where.title,
        ) ?? null,
      create: async (args) => {
        notifications.push(args.data);
        return args.data;
      },
    },
  };
  return { store, notifications };
}

function reservation(
  overrides: Partial<SweepReservation> = {},
): SweepReservation {
  return {
    id: "res_1",
    code: "OVR-TEST1",
    status: "RENTAL_ACTIVE",
    // Stored dates are UTC midnight of the picked calendar day.
    startDate: new Date("2026-03-08T00:00:00.000Z"),
    endDate: new Date("2026-03-12T00:00:00.000Z"),
    renterId: "user_renter",
    hostId: "user_host",
    listing: { title: "دوچرخه کوهستان" },
    ...overrides,
  };
}

describe("rental-reminders (date-aware reminders)", () => {
  test("RENTAL_ACTIVE two days before the deadline → renter AND host reminder", async () => {
    const { store, notifications } = makeStore([reservation()]);
    const { checked, created } = await runRentalReminderSweep(NOW, store);
    expect(checked).toBe(1);
    expect(created).toBe(2);
    expect(notifications.every((n) => n.type === "REMINDER")).toBe(true);
    expect(notifications.map((n) => n.userId).sort()).toEqual([
      "user_host",
      "user_renter",
    ]);
    expect(
      notifications.every((n) =>
        n.title.includes("دو روز دیگر مهلت بازگشت کالاست"),
      ),
    ).toBe(true);
    // The body carries the exact stored Jalali deadline, not a device-timezone guess.
    expect(notifications[0].body).toContain("۲۱ اسفند ۱۴۰۴");
    // Links point each side to their own page.
    expect(notifications.find((n) => n.userId === "user_renter")?.link).toBe(
      "/rentals",
    );
    expect(notifications.find((n) => n.userId === "user_host")?.link).toBe(
      "/host-dashboard",
    );
  });

  test("re-running the sweep never duplicates a reminder", async () => {
    const { store, notifications } = makeStore([reservation()]);
    await runRentalReminderSweep(NOW, store);
    const second = await runRentalReminderSweep(NOW, store);
    expect(second.created).toBe(0);
    expect(notifications).toHaveLength(2);
  });

  test("one day before and on the deadline day produce distinct stages", async () => {
    const tomorrow = makeStore([
      reservation({ endDate: new Date("2026-03-11T00:00:00.000Z") }),
    ]);
    const r1 = await runRentalReminderSweep(NOW, tomorrow.store);
    expect(r1.created).toBe(2);
    expect(
      tomorrow.notifications.every((n) =>
        n.title.startsWith("فردا مهلت بازگشت کالاست"),
      ),
    ).toBe(true);

    const today = makeStore([
      reservation({ endDate: new Date("2026-03-10T00:00:00.000Z") }),
    ]);
    const r2 = await runRentalReminderSweep(NOW, today.store);
    expect(r2.created).toBe(2);
    expect(
      today.notifications.every((n) =>
        n.title.startsWith("امروز مهلت بازگشت کالاست"),
      ),
    ).toBe(true);
  });

  test("overdue return → daily «تأخیر» reminder with Persian day counter", async () => {
    const { store, notifications } = makeStore([
      reservation({ endDate: new Date("2026-03-07T00:00:00.000Z") }),
    ]);
    const { created } = await runRentalReminderSweep(NOW, store);
    expect(created).toBe(2);
    expect(
      notifications.every((n) =>
        n.title.includes("تأخیر در بازگشت کالا — «OVR-TEST1» (روز ۳)"),
      ),
    ).toBe(true);
    // The renter is told to register the return, the host to escalate.
    expect(notifications.find((n) => n.userId === "user_renter")!.body).toContain(
      "درخواست بازگشت",
    );
    expect(notifications.find((n) => n.userId === "user_host")!.body).toContain(
      "خسارت و داوری",
    );
    // Next day → the counter moves, so the new day's reminder is written too.
    const nextDay = await runRentalReminderSweep(
      new Date("2026-03-11T12:00:00.000Z"),
      store,
    );
    expect(nextDay.created).toBe(2);
    expect(notifications).toHaveLength(4);
  });

  test("PAID reservation gets delivery-day reminders (2 days / tomorrow)", async () => {
    const inTwoDays = makeStore([
      reservation({
        status: "PAID",
        startDate: new Date("2026-03-12T00:00:00.000Z"),
        endDate: new Date("2026-03-15T00:00:00.000Z"),
      }),
    ]);
    const r1 = await runRentalReminderSweep(NOW, inTwoDays.store);
    expect(r1.created).toBe(2);
    expect(
      inTwoDays.notifications.every((n) =>
        n.title.includes("دو روز دیگر روز تحویل کالاست"),
      ),
    ).toBe(true);

    const tomorrow = makeStore([
      reservation({
        status: "PAID",
        startDate: new Date("2026-03-11T00:00:00.000Z"),
        endDate: new Date("2026-03-14T00:00:00.000Z"),
      }),
    ]);
    const r2 = await runRentalReminderSweep(NOW, tomorrow.store);
    expect(r2.created).toBe(2);
    expect(
      tomorrow.notifications.every((n) =>
        n.title.startsWith("فردا روز تحویل کالاست"),
      ),
    ).toBe(true);
  });

  test("PAID with a past delivery day → daily overdue-delivery nudge; DELIVERED is never nudged for it", async () => {
    const paid = makeStore([
      reservation({
        status: "PAID",
        startDate: new Date("2026-03-08T00:00:00.000Z"),
        endDate: new Date("2026-03-11T00:00:00.000Z"),
      }),
    ]);
    const r1 = await runRentalReminderSweep(NOW, paid.store);
    expect(r1.created).toBe(2);
    expect(
      paid.notifications.every((n) =>
        n.title.includes("روز تحویل کالا گذشته است — «OVR-TEST1» (روز ۲)"),
      ),
    ).toBe(true);

    const delivered = makeStore([
      reservation({
        status: "DELIVERED",
        startDate: new Date("2026-03-08T00:00:00.000Z"),
        endDate: new Date("2026-03-11T00:00:00.000Z"),
      }),
    ]);
    const r2 = await runRentalReminderSweep(NOW, delivered.store);
    expect(r2.created).toBe(0);
    expect(delivered.notifications).toHaveLength(0);
  });

  test("dates far outside the reminder windows stay quiet", async () => {
    const quiet = makeStore([
      reservation({
        status: "PAID",
        startDate: new Date("2026-03-20T00:00:00.000Z"),
        endDate: new Date("2026-03-23T00:00:00.000Z"),
      }),
      reservation({
        status: "RENTAL_ACTIVE",
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        endDate: new Date("2026-03-20T00:00:00.000Z"),
      }),
    ]);
    const { checked, created } = await runRentalReminderSweep(NOW, quiet.store);
    expect(checked).toBe(2);
    expect(created).toBe(0);
  });
});
