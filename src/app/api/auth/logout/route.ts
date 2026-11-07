import { destroySession } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

/** POST /api/auth/logout — destroy the session; every page returns to guest state. */
export async function POST() {
  await destroySession();
  return jsonOk({ ok: true });
}
