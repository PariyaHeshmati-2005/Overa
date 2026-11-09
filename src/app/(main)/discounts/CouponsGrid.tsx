"use client";

import { useState } from "react";
import { Toaster, toast } from "sonner";

export type Coupon = {
  code: string;
  group: "welcome" | "platform" | "host" | "reward";
  badgeIcon: string;
  badge: string;
  badgeCls: string;
  status: string;
  statusCls: string;
  from: string;
  title: string;
  highlight: string;
  category: string;
  minOrderLabel: string;
  minOrderValue: string;
  expiry: string;
  expiryCls: string;
  featured?: boolean;
};

const TABS = [
  { key: "all", label: "همه کدهای تخفیف (۱۲)", icon: "all_inclusive" },
  { key: "welcome", label: "خوش‌آمدگویی و کاربر جدید", icon: "card_giftcard" },
  { key: "platform", label: "تخفیف‌های سراسری پلتفرم", icon: "campaign" },
  { key: "host", label: "کدهای ویژه میزبانان برتر", icon: "storefront" },
  { key: "reward", label: "پاداش مشارکت", icon: "loyalty" },
] as const;

export function CopyCouponButton({ code }: { code: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("کد کپی شد");
    } catch {
      // Clipboard API can be unavailable (non-secure context) — fallback:
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast.success("کد کپی شد");
      } catch {
        toast.error("کپی انجام نشد؛ کد را دستی انتخاب کنید.");
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="کپی کد تخفیف"
      className="px-3.5 py-2 rounded-xl bg-m3-primary text-on-primary text-xs font-bold hover:bg-m3-primary/95 transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
    >
      <span className="material-symbols-outlined text-[16px]">content_copy</span>
      <span>کپی کد</span>
    </button>
  );
}

export default function CouponsGrid({ coupons }: { coupons: Coupon[] }) {
  const [tab, setTab] = useState<string>("all");
  const visible = tab === "all" ? coupons : coupons.filter((c) => c.group === tab);

  return (
    <div className="mb-8">
      <Toaster position="bottom-left" dir="rtl" />
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "px-4 py-2 rounded-xl bg-m3-primary text-on-primary shadow-sm shrink-0 flex items-center gap-1.5"
                : "px-4 py-2 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-m3-primary hover:bg-surface-variant border border-[#ece7f3] transition-colors shrink-0 flex items-center gap-1.5"
            }
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Section header + demo note */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#130e1b] flex items-center gap-2">
            <span className="material-symbols-outlined text-m3-primary text-[22px]">local_activity</span>
            کدهای تخفیف معتبر و آماده استفاده
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            کد مورد نظر را کپی کرده و هنگام ثبت سفارش در کادر کد تخفیف وارد فرمایید.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>همگی تست‌شده و فعال</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <span className="material-symbols-outlined text-[14px]">science</span>
            <span>کوپن‌های این صفحه نمایشی/نمونه هستند</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((c) => (
          <div
            key={c.code}
            className={
              c.featured
                ? "bg-surface-container-lowest rounded-2xl p-5 border-2 border-m3-primary/30 hover:border-m3-primary shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                : "bg-surface-container-lowest rounded-2xl p-5 border border-[#ece7f3] hover:border-m3-primary/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            }
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${c.badgeCls}`}>
                  <span className="material-symbols-outlined text-[14px]">{c.badgeIcon}</span>
                  {c.badge}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.statusCls}`}>{c.status}</span>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant font-medium">{c.from}</div>
                <h3 className="text-base font-extrabold text-[#130e1b] mt-0.5">{c.title}</h3>
                <div className="text-xs text-[#078845] font-bold mt-1">{c.highlight}</div>
              </div>
              <div className="p-3 bg-[#f9f8fc] rounded-xl border border-[#ece7f3] space-y-1.5 text-xs text-on-surface-variant">
                <div className="flex items-center justify-between">
                  <span>دسته‌بندی:</span>
                  <span className="font-bold text-[#130e1b]">{c.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{c.minOrderLabel}:</span>
                  <span className="font-bold text-[#130e1b]">{c.minOrderValue}</span>
                </div>
                <div className={`flex items-center justify-between font-semibold ${c.expiryCls}`}>
                  <span>مهلت اعتبار:</span>
                  <span>{c.expiry}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#ece7f3]">
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono font-extrabold text-sm text-center py-2 px-3 bg-purple-50 text-m3-primary border border-dashed border-m3-primary/60 rounded-xl select-all tracking-wider">
                  {c.code}
                </div>
                <CopyCouponButton code={c.code} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
