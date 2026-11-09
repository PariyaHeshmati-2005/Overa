"use client";

import Link from "next/link";
import { useState } from "react";
import { toPersianDigits } from "@/lib/format";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
const LABELS = [
  "امتیاز خودت رو انتخاب کن",
  "خیلی بد",
  "بد",
  "متوسط",
  "خوب",
  "عالی",
];

type State = "form" | "success" | "already";

/**
 * Review form — faithful port of submit-review.html (star picker + comment +
 * product summary card + success screen). POSTs to /api/reviews; a 409 means
 * the user already reviewed this rental (source-style info state).
 */
export default function SubmitReviewForm({
  reservationId,
  reservationCode,
  listing,
  authorName,
}: {
  reservationId: string;
  reservationCode: string;
  listing: { id: string; title: string; imageUrl: string; ownerName: string };
  authorName: string;
}) {
  const [state, setState] = useState<State>("form");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shown = hover || rating;
  const maxChars = 600;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = comment.trim();
    if (!rating) {
      setError("لطفاً امتیاز خودت رو انتخاب کن.");
      return;
    }
    if (text.length < 10) {
      setError("متن نظر باید حداقل ۱۰ کاراکتر باشه.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, rating, comment: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setState("already");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "خطایی در ثبت دیدگاه رخ داد؛ دوباره تلاش کنید.");
        return;
      }
      setState("success");
      toast.success("دیدگاه شما ثبت شد");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ اتصال خود را بررسی کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------ success state ----------------------------- */
  if (state === "success") {
    return (
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <svg className="w-7 h-7 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"></polyline>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">ممنون از نظرت!</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            دیدگاه شما ثبت شد و در لیست نظرات این محصول نمایش داده می‌شود.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            className="flex-1 bg-m3-primary hover:bg-m3-primary/90 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            href={`/item-details/${listing.id}#reviews`}
          >
            دیدن نظر در صفحه‌ی محصول
          </Link>
          <Link
            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm border border-slate-200 transition-colors"
            href="/"
          >
            صفحه‌ی اصلی
          </Link>
        </div>
        <Toaster position="top-center" richColors />
      </section>
    );
  }

  /* --------------------------- already-reviewed state ----------------------- */
  if (state === "already") {
    return (
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
          <svg className="w-7 h-7 stroke-current" fill="none" strokeWidth="2.2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v4" strokeLinecap="round"></path>
            <path d="M12 16h.01" strokeLinecap="round"></path>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">این دیدگاه قبلاً ثبت شده</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            برای هر اجاره فقط یک دیدگاه مجاز است؛ دیدگاه شما از قبل در لیست نظرات
            این محصول موجود است.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            className="flex-1 bg-m3-primary hover:bg-m3-primary/90 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            href={`/item-details/${listing.id}#reviews`}
          >
            دیدن نظر در صفحه‌ی محصول
          </Link>
          <Link
            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl text-sm border border-slate-200 transition-colors"
            href="/"
          >
            صفحه‌ی اصلی
          </Link>
        </div>
        <Toaster position="top-center" richColors />
      </section>
    );
  }

  /* ------------------------------- form state ------------------------------- */
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      <div>
        <h1 className="text-lg font-black text-slate-800">اجاره‌ات چطور بود؟</h1>
        <p className="text-xs text-slate-500 mt-1">
          نظر تو به بقیه کمک می‌کنه بهتر انتخاب کنن.
        </p>
      </div>

      {/* Product summary card (real data from the reservation listing) */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
        <img
          alt={listing.title}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
          src={listing.imageUrl}
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-snug">{listing.title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            اجاره‌دهنده: <span>{listing.ownerName}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            کد رزرو: <span className="font-mono">{reservationCode}</span>
          </p>
        </div>
      </div>

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        {/* Rating */}
        <div className="text-center space-y-2">
          <div
            aria-label="امتیاز"
            className="flex items-center justify-center gap-1.5"
            onMouseLeave={() => setHover(0)}
            role="radiogroup"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                aria-checked={rating === i}
                aria-label={`${toPersianDigits(i)} ستاره`}
                className="p-1 transition-transform hover:scale-110"
                key={i}
                onClick={() => {
                  setRating(i);
                  setError("");
                }}
                onMouseEnter={() => setHover(i)}
                role="radio"
                type="button"
              >
                <svg
                  className={`w-10 h-10 fill-current ${i <= shown ? "text-amber-400" : "text-slate-200"}`}
                  viewBox="0 0 24 24"
                >
                  <path d={STAR_PATH}></path>
                </svg>
              </button>
            ))}
          </div>
          <p className={`text-xs font-semibold min-h-4 ${shown ? "text-m3-primary" : "text-slate-400"}`}>
            {LABELS[shown]}
          </p>
        </div>

        {/* Text */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="rv-text">
            نظرت رو بنویس
          </label>
          <textarea
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-3 focus:border-m3-primary focus:ring-4 focus:ring-m3-primary/10 transition-all placeholder:text-slate-400 resize-none outline-none"
            id="rv-text"
            maxLength={maxChars}
            placeholder="وضعیت وسیله، تحویل و برخورد اجاره‌دهنده چطور بود؟"
            rows={4}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (e.target.value.trim().length >= 10) setError("");
            }}
          ></textarea>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] font-semibold text-rose-500 min-h-4">{error}</p>
            <span className="text-[11px] text-slate-400">
              {toPersianDigits(comment.length)} / ۶۰۰
            </span>
          </div>
        </div>

        {/* Author */}
        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-slate-400 stroke-current"
            fill="none"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          نظر با نام <span className="font-bold text-slate-700">{authorName}</span> نمایش
          داده می‌شه.
        </p>

        <button
          className="w-full bg-m3-primary hover:bg-m3-primary/90 disabled:bg-m3-primary/70 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-m3-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={submitting}
          type="submit"
        >
          {submitting ? (
            <>
              <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              در حال ثبت…
            </>
          ) : (
            "ثبت نظر"
          )}
        </button>
      </form>
      <Toaster position="top-center" richColors />
    </section>
  );
}
