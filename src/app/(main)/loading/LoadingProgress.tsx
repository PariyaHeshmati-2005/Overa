"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toPersianDigits } from "@/lib/format";

/**
 * Animated loading metric (from loading.html): progress creeps toward 96%
 * and the demo splash auto-returns home after 3.5s, exactly like the source.
 */
export default function LoadingProgress() {
  const router = useRouter();
  const [progress, setProgress] = useState(68);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 96 ? 96 : Math.min(96, p + Math.floor(Math.random() * 4) + 1)));
    }, 600);
    const redirectTimer = setTimeout(() => router.push("/"), 3500);
    return () => {
      clearInterval(interval);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <>
      <div className="flex items-center justify-between mb-2 text-label-md">
        <span className="text-on-primary text-numeric-stat">{toPersianDigits(progress)}٪</span>
        <span className="text-on-primary-container text-label-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">bolt</span>
          دریافت کاتالوگ و گارانتی
        </span>
      </div>
      <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-white rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-on-primary-container opacity-85">
        <span>پاسخ سرور: ۱۱۰ میلی‌ثانیه</span>
        <span>رمزنگاری SSL</span>
      </div>
    </>
  );
}
