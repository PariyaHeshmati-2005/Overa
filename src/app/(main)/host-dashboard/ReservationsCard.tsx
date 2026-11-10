"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { faNumber } from "@/lib/format";

export type ReservationRow = {
  id: string;
  code: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  createdAtLabel: string;
  subtotal: number;
  listingTitle: string;
  listingImage: string | null;
  renterName: string;
  allowedActions: ("approve" | "reject" | "deliver")[];
};

const ACTION_LABELS: Record<string, string> = {
  approve: "تایید درخواست",
  reject: "رد درخواست",
  deliver: "تحویل داده شد",
};

/**
 * «آخرین اجاره‌ها» card — real reservations of the signed-in host with
 * status chips (canonical labels/colors) and working approve/reject/deliver
 * actions via PATCH /api/reservations/[id].
 */
export default function ReservationsCard({ reservations }: { reservations: ReservationRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(reservation: ReservationRow, action: string) {
    const confirmText =
      action === "approve"
        ? `درخواست «${reservation.code}» از ${reservation.renterName} تایید شود؟`
        : action === "reject"
          ? `درخواست «${reservation.code}» رد شود؟`
          : `تحویل «${reservation.listingTitle}» به مستأجر ثبت شود؟`;
    if (!window.confirm(confirmText)) return;

    setBusy(reservation.id + action);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "انجام عملیات ممکن نشد.");
        return;
      }
      toast.success(
        action === "approve"
          ? "درخواست تایید شد؛ مستأجر باید قرارداد را تایید کند."
          : action === "reject"
            ? "درخواست رد شد."
            : "تحویل وسیله ثبت شد؛ دوران استفاده آغاز شد.",
      );
      router.refresh();
    } catch {
      toast.error("خطای شبکه — دوباره تلاش کنید.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
      data-purpose="recent-rentals-list"
    >
      <div>
        <Toaster position="bottom-left" richColors />
        <div className="flex items-center justify-between mb-5">
          <Link
            className="text-xs font-semibold text-purple-600 hover:text-purple-700"
            href="/rentals"
          >
            مشاهده همه
          </Link>
          <h2 className="text-base font-bold text-slate-800">آخرین اجاره‌ها</h2>
        </div>

        {reservations.length === 0 && (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-[40px] text-slate-200">
              calendar_today
            </span>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              هنوز درخواست اجاره‌ای برای وسایل شما ثبت نشده است.
            </p>
          </div>
        )}

        <div className="divide-y divide-slate-100 space-y-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="pt-3 first:pt-0 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {r.listingImage ? (
                   
                  <img
                    alt={r.listingTitle}
                    className="w-14 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                    src={r.listingImage}
                  />
                ) : (
                  <div className="w-14 h-12 rounded-xl bg-slate-100 border border-slate-100 shrink-0 flex items-center justify-center text-slate-300">
                    <span className="material-symbols-outlined text-[18px]">image</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                    {r.listingTitle}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {r.createdAtLabel} — {r.renterName}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    {faNumber(r.subtotal)}
                    <span className="font-normal text-[10px] text-slate-400"> تومان</span>
                    <span className="text-[10px] text-slate-300 mx-1">|</span>
                    <span className="text-[10px] font-normal text-slate-400">{r.code}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-1.5 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium text-center ${r.statusColor}`}
                >
                  {r.statusLabel}
                </span>
                {r.allowedActions.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {r.allowedActions.includes("approve") && (
                      <button
                        onClick={() => act(r, "approve")}
                        disabled={busy !== null}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition disabled:opacity-50"
                      >
                        {busy === r.id + "approve" ? "…" : ACTION_LABELS.approve}
                      </button>
                    )}
                    {r.allowedActions.includes("reject") && (
                      <button
                        onClick={() => act(r, "reject")}
                        disabled={busy !== null}
                        className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold transition disabled:opacity-50"
                      >
                        {busy === r.id + "reject" ? "…" : ACTION_LABELS.reject}
                      </button>
                    )}
                    {r.allowedActions.includes("deliver") && (
                      <button
                        onClick={() => act(r, "deliver")}
                        disabled={busy !== null}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition disabled:opacity-50"
                      >
                        {busy === r.id + "deliver" ? "…" : ACTION_LABELS.deliver}
                      </button>
                    )}
                  </div>
                )}
                <Link
                  href={`/rental-lifecycle/${r.id}`}
                  className="text-slate-400 hover:text-slate-600 self-end"
                  title="مشاهده چرخه اجاره"
                  aria-label={`چرخه اجاره ${r.code}`}
                >
                  <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
