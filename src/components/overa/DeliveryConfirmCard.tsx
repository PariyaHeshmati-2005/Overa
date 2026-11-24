"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import OtpConfirmFlow from "./OtpConfirmFlow";

/**
 * «تأیید دریافت کالا» card — shown ONLY to the renter while the host has
 * recorded the hand-over (status DELIVERED). FOUR options, exactly like the
 * physical hand-over reality:
 *
 *  1. «کالا را سالم تحویل گرفتم» → OTP (DELIVERY_RECEIVED) → RENTAL_ACTIVE,
 *     deliveryStatus = ACCEPTED_CLEAN.
 *  2. «تحویل کالا با وجود برخی مشکلات» → the renter writes the issues down,
 *     then OTP-confirms; deliveryStatus = ACCEPTED_WITH_ISSUES and the note is
 *     stored as arbitration evidence (visible to host + admin panels).
 *  3. «اعلام خسارت و تحویل کالا» → the dedicated damage-description page
 *     (/declare-damage). The declaration is recorded (DamageClaim stage
 *     DELIVERY) AND the order stays in DELIVERED, so the renter can still
 *     receive the item through the OTP flow; the declaration shows up in the
 *     renter, host and admin panels with the goods-received status.
 *  4. «اعلام خسارت و عدم تحویل کالا و باطل کردن اجاره» → refuse_delivery:
 *     the whole order is voided, every paid Toman flows back to the renter
 *     (sandbox) and the item never leaves the host's custody.
 */
export type DeliveryConfirmCardProps = {
  reservationId: string;
  code: string;
  listingTitle: string;
  hostName: string;
  /** Optional callback after a verified code (e.g. reload a list). */
  onSettled?: () => void;
};

type Mode = null | "clean" | "issues" | "refuse";

export default function DeliveryConfirmCard({
  reservationId,
  code,
  listingTitle,
  hostName,
  onSettled,
}: DeliveryConfirmCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [issuesNote, setIssuesNote] = useState("");
  const [refuseNote, setRefuseNote] = useState("");
  const [refusing, setRefusing] = useState(false);

  /* «اعلام خسارت و تحویل کالا» is a NAVIGATION: the renter writes the damage
     description on /declare-damage; the claim is recorded there and the order
     STAYS in DELIVERED so the receipt (OTP) flow can continue afterwards. */
  function goDeclareDamage() {
    router.push(`/declare-damage/${reservationId}`);
  }

  async function refuseDelivery() {
    if (
      !window.confirm(
        `آیا برای سفارش «${code}» «اعلام خسارت و عدم تحویل کالا» ثبت شود؟ کل اجاره باطل می‌شود، کالا نزد میزبان می‌ماند و همهٔ مبالغ پرداختی به کیف پول شما بازگردانده می‌شود (شبیه‌سازی).`,
      )
    )
      return;
    setRefusing(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refuse_delivery",
          ...(refuseNote.trim() ? { note: refuseNote.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "ثبت عدم تحویل ممکن نشد.");
        return;
      }
      toast.success(
        "اجاره باطل شد؛ همهٔ مبالغ پرداختی به کیف پول شما بازگشت و کالا نزد میزبان باقی ماند.",
        { duration: 6000 },
      );
      onSettled?.();
      router.refresh();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setRefusing(false);
    }
  }

  return (
    <article
      className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      data-purpose="delivery-confirmation-card"
    >
      {/* Card header + status chip */}
      <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-m3-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">package_2</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              تأیید دریافت کالا
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              سفارش #{code} — {listingTitle}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-gold/15 text-accent-gold border border-accent-gold/30 whitespace-nowrap">
          در انتظار بازرسی شما
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-slate-800">
            وضعیت کالا را هنگام تحویل بررسی و اعلام کنید
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            میزبان ({hostName}) تحویل این کالا را در سیستم ثبت کرده است. کالا
            را بازرسی کنید و یکی از سه گزینهٔ زیر را انتخاب نمایید؛ انتخاب شما
            در رویدادهای اجاره ثبت می‌شود.
          </p>
        </div>

        {mode === null && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option 1: clean hand-over (OTP-gated) */}
            <button
              type="button"
              onClick={() => setMode("clean")}
              className="py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 shadow-md transition active:scale-[0.99] bg-m3-primary hover:bg-primary-container text-white shadow-m3-primary/25"
            >
              <span className="material-symbols-outlined text-base">
                check_circle
              </span>
              کالا را سالم تحویل گرفتم
            </button>
            {/* Option 2: accept WITH issues + written note */}
            <button
              type="button"
              onClick={() => setMode("issues")}
              className="py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.99] bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold border border-accent-gold/40"
            >
              <span className="material-symbols-outlined text-base">
                report_problem
              </span>
              تحویل کالا با وجود برخی مشکلات
            </button>
            {/* Option 3: declare damage AND still take delivery — the damage
                description page keeps the order in DELIVERED so the OTP flow
                continues; the claim shows up in all three panels. */}
            <button
              type="button"
              onClick={goDeclareDamage}
              className="sm:col-span-3 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-row items-center justify-center gap-1.5 transition active:scale-[0.99] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              اعلام خسارت و تحویل کالا (دریافت با ثبت توضیحات خسارت)
            </button>
            {/* Option 4: refuse + void the whole rental */}
            <button
              type="button"
              onClick={() => setMode("refuse")}
              className="py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.99] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
            >
              <span className="material-symbols-outlined text-base">
                block
              </span>
              اعلام خسارت و عدم تحویل کالا و باطل کردن اجاره
            </button>
          </div>
        )}

        {mode === "clean" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-surface-container rounded-xl px-3 py-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-m3-primary text-base">
                  package_2
                </span>
                تأیید دریافت سالم با کد یک‌بارمصرف
              </span>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
                title="بازگشت به گزینه‌ها"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <OtpConfirmFlow
              reservationId={reservationId}
              stage="DELIVERY_RECEIVED"
              requestLabel="سالم تحویل گرفتم"
              successMessage="تحویل کالا با موفقیت تأیید شد و دوره اجاره شما آغاز گردید."
              onVerified={onSettled}
            />
          </div>
        )}

        {mode === "issues" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-surface-container rounded-xl px-3 py-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-accent-gold text-base">
                  report_problem
                </span>
                تحویل کالا با وجود برخی مشکلات
              </span>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
                title="بازگشت به گزینه‌ها"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              با این گزینه کالا را می‌گیرید و دورهٔ اجاره فعال می‌شود؛ مشکلات
              مشاهده‌شده را دقیق بنویسید تا در پروندهٔ اجاره ثبت شود. اگر
              بعداً خسارتی اعلام شود، این متن مبنای داوری کارشناسان اٌوِرا
              قرار می‌گیرد.
            </p>
            <textarea
              value={issuesNote}
              onChange={(e) => setIssuesNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="مثلاً: دو شارژر اضافه موجود نبود؛ بدنه در گوشهٔ سمت چپ خط و خش دارد و لنز واید همراه وسیله نبود…"
              className="w-full text-xs rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary/30 resize-none"
            />
            {issuesNote.trim().length >= 10 ? (
              <OtpConfirmFlow
                reservationId={reservationId}
                stage="DELIVERY_RECEIVED"
                requestLabel="ثبت توضیحات و تحویل گرفتن کالا"
                successMessage="کالا با ثبت یادداشت مشکلات تحویل گرفته شد و دورهٔ اجاره فعال گردید."
                extraBody={{ issuesNote: issuesNote.trim() }}
                onVerified={onSettled}
              />
            ) : (
              <p className="text-[11px] text-slate-400 font-semibold">
                برای فعال شدن مرحلهٔ تأیید با کد یک‌بارمصرف، توضیحات را بنویسید
                (حداقل ۱۰ کاراکتر).
              </p>
            )}
          </div>
        )}

        {mode === "refuse" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-surface-container rounded-xl px-3 py-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-rose-600 text-base">
                  block
                </span>
                اعلام خسارت و عدم تحویل کالا و باطل کردن اجاره
              </span>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
                title="بازگشت به گزینه‌ها"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <ul className="text-[11px] text-slate-600 leading-6 list-disc pr-4 space-y-1">
              <li>کل اجاره باطل می‌شود و امکان بازگشت آن وجود ندارد.</li>
              <li>
                همهٔ مبالغ پرداختی (اجاره و در صورت وديعهٔ نقدی، ودیعه) به کیف
                پول شما بازگردانده می‌شود (شبیه‌سازی).
              </li>
              <li>میزبان و کارشناسان اٌوِرا بلافاصله مطلع می‌شوند.</li>
            </ul>
            <textarea
              value={refuseNote}
              onChange={(e) => setRefuseNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="شرح خسارت مشاهده‌شده (اختیاری اما توصیه می‌شود) — مثلاً: صفحهٔ دستگاه ترک خورده است و روشن نمی‌شود…"
              className="w-full text-xs rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary/30 resize-none"
            />
            <button
              type="button"
              onClick={() => void refuseDelivery()}
              disabled={refusing}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.99] bg-m3-error hover:bg-m3-error/90 text-on-primary shadow-md disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              {refusing
                ? "در حال ثبت و ابطال اجاره…"
                : "ثبت اعلام خسارت و ابطال اجاره"}
            </button>
          </div>
        )}

        <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-50 pt-3">
          انتخاب شما در «رویدادهای این اجاره» ثبت می‌شود؛ در صورت نیاز به گفتگو
          از دکمهٔ «گفتگو» استفاده کنید. این فرآیند جایگزین مراجع قانونی نیست.
        </p>
      </div>
    </article>
  );
}
