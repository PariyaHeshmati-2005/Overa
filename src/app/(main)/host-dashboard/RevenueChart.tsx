"use client";

import { useMemo, useState } from "react";
import { faNumber } from "@/lib/format";

export type ChartBucket = {
  label: string;
  count: number;
  revenue: number;
};

export type ChartRanges = {
  "7d": ChartBucket[];
  "30d": ChartBucket[];
  "90d": ChartBucket[];
};

const RANGE_META: { key: keyof ChartRanges; label: string }[] = [
  { key: "30d", label: "۳۰ روز اخیر" },
  { key: "7d", label: "۷ روز اخیر" },
  { key: "90d", label: "۹۰ روز اخیر" },
];

/**
 * «آمار اجاره و درآمد» widget from the source host-dashboard — re-rendered
 * from REAL reservation data (per-period counts + revenue sums) using simple
 * bars via divs. Hovering a bar shows the source-style tooltip.
 */
export default function RevenueChart({ ranges }: { ranges: ChartRanges }) {
  const [rangeIdx, setRangeIdx] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  const rangeKey = RANGE_META[rangeIdx].key;
  const buckets = ranges[rangeKey];

  const { maxCount, maxRevenue, total } = useMemo(() => {
    const mc = Math.max(1, ...buckets.map((b) => b.count));
    const mr = Math.max(1, ...buckets.map((b) => b.revenue));
    return {
      maxCount: mc,
      maxRevenue: mr,
      total: buckets.reduce((a, b) => a + b.count, 0),
    };
  }, [buckets]);

  const tip = hovered !== null ? buckets[hovered] : null;

  return (
    <div
      className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
      data-purpose="revenue-chart-card"
    >
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRangeIdx((i) => (i + 1) % RANGE_META.length);
              setHovered(null);
            }}
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
            title="تغییر بازه زمانی"
          >
            <span className="">{RANGE_META[rangeIdx].label}</span>
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
          <div className="flex items-center gap-4 text-xs pr-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-600"></span>
              <span className="">تعداد اجاره</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <span className="">درآمد</span>
            </div>
          </div>
        </div>
        <h2 className="text-base font-bold text-slate-800">آمار اجاره و درآمد</h2>
      </div>

      {/* Chart Visual Area — real data, bars via divs */}
      <div className="relative w-full h-56 pt-4" data-purpose="chart-visual">
        {tip && (
          <div
            className="absolute top-2 z-20 bg-[#1c0836] text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-purple-800/50 text-right pointer-events-none min-w-[150px]"
            style={{
              right: `${(hovered! + 0.5) * (100 / buckets.length)}%`,
              transform: "translateX(50%)",
            }}
          >
            <div className="text-[10px] text-purple-300 font-semibold mb-0.5">{tip.label}</div>
            <div className="">
              درآمد: <span className="font-bold text-white">{faNumber(tip.revenue)}</span> تومان
            </div>
            <div className="text-purple-200 text-[10px]">
              اجاره‌ها: <span className="font-bold text-white">{faNumber(tip.count)}</span> مورد
            </div>
            <div className="w-2 h-2 bg-[#1c0836] rotate-45 absolute -bottom-1 right-1/2 translate-x-1/2"></div>
          </div>
        )}

        {total === 0 && (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-slate-400">
            در این بازه هنوز رزروی ثبت نشده است — با ثبت و اجاره دادن وسیله‌ها این نمودار پر می‌شود.
          </p>
        )}

        <div className="flex h-full items-end gap-1.5 px-1 pb-6" dir="ltr">
          {buckets.map((b, i) => {
            const h = Math.max(4, Math.round((b.count / maxCount) * 100));
            const isPeak = b.count === maxCount && b.count > 0;
            return (
              <div
                key={i}
                className="relative flex-1 h-full flex flex-col justify-end group"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((p) => (p === i ? null : p))}
              >
                <div className="flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isPeak ? "bg-[#6d28d9]" : "bg-[#ede9fe] group-hover:bg-[#c4b5fd]"
                    }`}
                    style={{ height: `${h}%` }}
                  ></div>
                </div>
                <div className="pt-2 text-center">
                  <span className="text-[10px] text-slate-400 leading-none block truncate">
                    {b.label}
                  </span>
                </div>
                {/* revenue dot (درآمد legend series) */}
                <span
                  className="absolute top-1 right-1/2 translate-x-1/2 size-2 rounded-full bg-purple-400"
                  style={{ opacity: b.revenue > 0 ? 1 : 0.25 }}
                  title={`درآمد: ${faNumber(b.revenue)} تومان`}
                ></span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-2">
        محاسبه‌شده از رزروهای واقعی حساب شما — مبالغ به تومان (شبیه‌سازی).
      </p>
    </div>
  );
}
