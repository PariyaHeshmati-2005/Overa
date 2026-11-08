import { db } from "@/lib/db";
import { jsonError, jsonOk, requireUser } from "@/lib/api";

/** GET /api/wallet — balance + ledger (application ledger, sandbox-labelled). */
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const transactions = await db.walletTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return jsonOk({
    balance: user.walletBalance,
    transactions,
    notice:
      "این دفتر وضعیت درون‌برنامه‌ای است؛ تا زمان اتصال درگاه پرداخت واقعی، همه عملیات «شبیه‌سازی» هستند.",
  });
}

/**
 * POST /api/wallet — { action: "payout" } request a payout (sandbox), or
 * { action: "topup", amount } sandbox balance top-up for demo flows.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "payout") {
    const amount = Math.floor(Number(body.amount) || 0);
    if (amount < 100_000) return jsonError("حداقل مبلغ برداشت ۱۰۰,۰۰۰ تومان است.");
    if (amount > user.walletBalance)
      return jsonError("موجودی کافی نیست.");
    await db.$transaction([
      db.walletTransaction.create({
        data: {
          userId: user.id, type: "PAYOUT", amount: -amount, status: "PENDING",
          description: "درخواست برداشت به حساب بانکی — حالت شبیه‌سازی؛ تسویه توسط اپراتور انجام می‌شود.",
        },
      }),
      db.user.update({ where: { id: user.id }, data: { walletBalance: { decrement: amount } } }),
    ]);
    return jsonOk({ ok: true, notice: "درخواست برداشت ثبت شد (شبیه‌سازی)." }, 201);
  }

  if (action === "topup") {
    const amount = Math.floor(Number(body.amount) || 0);
    if (amount <= 0 || amount > 100_000_000) return jsonError("مبلغ شارژ نامعتبر است.");
    await db.$transaction([
      db.walletTransaction.create({
        data: {
          userId: user.id, type: "TOPUP", amount,
          description: "شارژ کیف پول از طریق درگاه آزمایشی — حالت شبیه‌سازی",
        },
      }),
      db.user.update({ where: { id: user.id }, data: { walletBalance: { increment: amount } } }),
    ]);
    return jsonOk({ ok: true, notice: "کیف پول شارژ شد (شبیه‌سازی)." }, 201);
  }

  return jsonError("کنش نامعتبر است.");
}
