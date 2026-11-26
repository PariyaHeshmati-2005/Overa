/**
 * One-shot rental reminder sweep — for real cron deployments.
 *
 * The app already drives the same sweep opportunistically from the
 * notifications and reservations endpoints (throttled to one run per minute
 * per server process). This script exists so an external scheduler (cron,
 * systemd timer, hosting scheduled task) can trigger it explicitly, e.g.
 * every hour:
 *
 *   bun run reminders        (scripts/env-run.sh bun run scripts/run-reminders.ts)
 *
 * Idempotent: reminder titles are deterministic per (reservation, stage,
 * day), so repeated runs never duplicate a reminder.
 */
import { runRentalReminderSweep } from "../src/lib/rental-reminders";

async function main() {
  const { checked, created } = await runRentalReminderSweep();
  console.log(
    `[reminders] sweep finished: ${checked} active reservation(s) checked, ${created} new reminder notification(s) written.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[reminders] sweep failed:", err);
  process.exit(1);
});
