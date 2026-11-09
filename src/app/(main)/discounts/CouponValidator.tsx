"use client";

import { useState } from "react";
import { Toaster, toast } from "sonner";

const KNOWN_CODES = [
  "OVR-WELCOME",
  "OVR-SPRING20",
  "SONY-HOST15",
  "GAME-WEEKEND",
  "FRIEND-100K",
  "VIP-RENT35",
];

export default function CouponValidator() {
  const [code, setCode] = useState("");

  function check() {
    const norm = code.trim().toUpperCase();
    if (!norm) {
      toast.error("ابتدا کد تخفیف را وارد کنید.");
      return;
    }
    if (KNOWN_CODES.includes(norm)) {
      toast.success(`کد «${norm}» معتبر است (کوپن نمایشی).`);
    } else {
      toast.error("کد یافت نشد یا منقضی شده است (کوپن‌ها نمایشی هستند).");
    }
  }

  return (
    <div className="bg-surface-container-lowest text-[#130e1b] rounded-2xl p-4 shadow-lg w-full lg:max-w-md border border-white/20">
      <Toaster position="bottom-left" dir="rtl" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#130e1b] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-m3-primary text-[18px]">verified</span>
          استعلام و اعتبارسنجی کد تخفیف
        </span>
        <span className="text-[11px] text-emerald-600 font-semibold">بررسی آنی قبل از پرداخت</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") check();
          }}
          className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-[#ece7f3] bg-[#f9f8fc] focus:outline-none focus:ring-2 focus:ring-m3-primary/20 text-[#130e1b] uppercase"
          placeholder="کد تخفیف را وارد کنید"
          type="text"
        />
        <button
          type="button"
          onClick={check}
          className="shrink-0 px-4 py-2.5 bg-m3-primary text-on-primary text-xs font-bold rounded-xl hover:bg-m3-primary/95 transition-all shadow-sm flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">check</span>
          بررسی وضعیت
        </button>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500"></span>
          تخفیف مستقیماً از فاکتور رزرو کسر می‌شود
        </span>
        <span className="font-medium text-m3-primary">تضمین سلامت کوپن‌ها</span>
      </div>
    </div>
  );
}
