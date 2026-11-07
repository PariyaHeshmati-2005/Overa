import { getCurrentUser } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

/** GET /api/auth/me — current session user (null for guests). */
export async function GET() {
  const user = await getCurrentUser();
  return jsonOk({ user });
}
