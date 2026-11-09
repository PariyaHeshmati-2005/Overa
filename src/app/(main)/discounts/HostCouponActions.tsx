"use client";

import { Toaster, toast } from "sonner";

/** Host coupon-creation actions — the issuing API is out of scope for the demo. */
export default function HostCouponActions() {
  return (
    <>
      <Toaster position="bottom-left" dir="rtl" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => toast.info("پیش‌نمایش شرایط کد در نسخه نمایشی به‌زودی فعال می‌شود.")}
          className="px-4 py-2.5 rounded-xl bg-[#ece7f3] text-[#130e1b] hover:bg-surface-variant text-xs font-semibold transition-colors"
        >
          پیش‌نمایش شرایط
        </button>
        <button
          type="button"
          onClick={() =>
            toast.info("صدور کد تخفیف واقعی در این نسخه نمایشی (Sandbox) فعال نیست.")
          }
          className="px-5 py-2.5 rounded-xl bg-m3-primary text-on-primary text-xs font-bold hover:bg-m3-primary/95 transition-all shadow-md shadow-m3-primary/20 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>ثبت و فعال‌سازی فوری کد</span>
        </button>
      </div>
    </>
  );
}
