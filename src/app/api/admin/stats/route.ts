import { db } from "@/lib/db";
import { jsonOk, requireAdmin } from "@/lib/api";

/** GET /api/admin/stats — operational overview for the admin console. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const [
    users, listings, pendingListings, reservations, activeRentals,
    claims, openClaims, completed, gmv, kycPending,
  ] = await Promise.all([
    db.user.count(),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.listing.count({ where: { status: "PENDING" } }),
    db.reservation.count(),
    db.reservation.count({ where: { status: { in: ["PAID", "DELIVERED", "RENTAL_ACTIVE"] } } }),
    db.damageClaim.count(),
    db.damageClaim.count({ where: { status: { in: ["OPEN", "COUNTER_EVIDENCE", "UNDER_REVIEW"] } } }),
    db.reservation.count({ where: { status: "COMPLETED" } }),
    db.walletTransaction.aggregate({
      where: { type: "RENTAL_PAYMENT", amount: { gt: 0 }, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.user.count({ where: { kycStatus: "PENDING" } }),
  ]);

  return jsonOk({
    users, activeListings: listings, pendingListings, reservations,
    activeRentals, claims, openClaims, completedRentals: completed,
    totalRentalsRevenue: gmv._sum.amount ?? 0, kycPending,
    notice: "مبالغ صرفاً دفتر درون‌برنامه‌ای (شبیه‌سازی) هستند.",
  });
}
