"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { faNumber, faToman, faDate, daysBetween } from "@/lib/format";
import { formatJalaliIso, type DateRange } from "@/lib/jalali";
import JalaliCalendar from "@/components/overa/JalaliCalendar";

export type ItemDetailData = {
  id: string;
  title: string;
  description: string;
  brand: string | null;
  specs: string | null;
  rules: string | null;
  dailyPrice: number;
  weeklyPrice: number | null;
  deposit: number;
  city: string;
  area: string | null;
  pickupInPerson: boolean;
  deliveryCourier: boolean;
  minDays: number;
  maxDays: number;
  instantBook: boolean;
  status: string;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  category: { slug: string; name: string };
  owner: { id: string; name: string; isHost: boolean };
  images: { url: string; alt: string | null }[];
};

export type ReviewData = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  hostReply: string | null;
  createdAt: string;
};

export type OwnerListingData = {
  id: string;
  title: string;
  dailyPrice: number;
  imageUrl: string;
};

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function StarSvg({
  filled,
  className,
}: {
  filled: boolean;
  className: string;
}) {
  return (
    <svg
      className={`${className} ${filled ? "text-amber-400" : "text-slate-200"} fill-current`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={STAR_PATH}></path>
    </svg>
  );
}

function StarsRow({ rating, className }: { rating: number; className: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`امتیاز ${faNumber(rating)} از ۵`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarSvg key={i} filled={i <= Math.round(rating)} className={className} />
      ))}
    </span>
  );
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[0][0] + "\u200c" + parts[1][0] : name.slice(0, 2);
}

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/* --------------------------------- Gallery --------------------------------- */

function Gallery({ images, title }: { images: { url: string; alt: string | null }[]; title: string }) {
  const list = images.length > 0 ? images : [{ url: "/assets/img/4bb41475c0e3.jpg", alt: null }];
  const [active, setActive] = useState(0);
  const thumbs = list.slice(0, 4);
  const extra = list.length - thumbs.length;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
      {/* Main Hero Image Box */}
      <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center group">
        <img
          alt={list[active]?.alt ?? title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          src={list[active]?.url}
        />
        <div className="absolute top-3 right-3 bg-[#7c3aed] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d={STAR_PATH}></path>
          </svg>
          <span>پیشنهاد ویژه</span>
        </div>
        <button
          type="button"
          aria-label="تصویر قبلی"
          onClick={() => setActive((a) => (a - 1 + list.length) % list.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow hover:bg-white transition-all opacity-80 group-hover:opacity-100"
        >
          <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button
          type="button"
          aria-label="تصویر بعدی"
          onClick={() => setActive((a) => (a + 1) % list.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow hover:bg-white transition-all opacity-80 group-hover:opacity-100"
        >
          <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-md">
          {faNumber(active + 1)}/{faNumber(list.length)}
        </div>
      </div>
      {/* Thumbnails Row */}
      <div className="grid grid-cols-4 gap-2">
        {thumbs.map((t, idx) => (
          <button
            key={t.url + idx}
            type="button"
            onClick={() => setActive(idx)}
            className={`rounded-lg overflow-hidden aspect-square bg-slate-100 cursor-pointer ${
              active === idx
                ? "border-2 border-[#7c3aed]"
                : "border border-slate-200 hover:border-[#8b5cf6]"
            }`}
          >
            <img alt={`${title} ${faNumber(idx + 1)}`} className="w-full h-full object-cover opacity-90" src={t.url} />
          </button>
        ))}
        {extra > 0 ? (
          <button
            type="button"
            onClick={() => setActive(Math.min(list.length - 1, thumbs.length))}
            className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-800 text-white flex items-center justify-center cursor-pointer hover:bg-slate-700"
          >
            <img alt={title} className="w-full h-full object-cover opacity-30 absolute inset-0" src={thumbs[thumbs.length - 1]?.url} />
            <div className="relative text-center">
              <span className="block text-sm font-bold leading-none">+{faNumber(extra)}</span>
              <span className="text-[10px] text-slate-300">بیشتر</span>
            </div>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------- Reviews section ------------------------------- */

function ReviewsSection({
  listingId,
  reviews,
  rating,
}: {
  listingId: string;
  reviews: ReviewData[];
  rating: number;
}) {
  const [sort, setSort] = useState("new");
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) c[r.rating] = (c[r.rating] ?? 0) + 1;
    return c;
  }, [reviews]);

  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : rating;

  const sorted = useMemo(() => {
    const list = [...reviews];
    if (sort === "new") list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "high") list.sort((a, b) => b.rating - a.rating);
    if (sort === "low") list.sort((a, b) => a.rating - b.rating);
    return list;
  }, [reviews, sort]);

  return (
    <section
      id="reviews"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden scroll-mt-32"
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#7c3aed] stroke-current" fill="none" strokeWidth="1.9" viewBox="0 0 24 24">
            <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          نظرات کاربران
          <span className="text-xs font-semibold text-slate-400">({faNumber(total)})</span>
        </h3>
        <Link
          href="/rentals"
          className="text-xs font-bold text-[#7c3aed] hover:text-[#6d28d9] bg-[#f5f3ff] hover:bg-[#ede9fe] px-3 py-1.5 rounded-lg transition-colors"
          title="ثبت نظر پس از اتمام اجاره، از صفحه رزروهای من"
        >
          ثبت نظر
        </Link>
      </div>

      <div className="p-5 space-y-6">
        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col sm:flex-row items-center gap-5">
          <div className="text-center shrink-0">
            <div className="text-3xl font-black text-slate-800">
              {faNumber(avg.toFixed(1)).replace(".", "٫")}
            </div>
            <StarsRow rating={avg} className="w-4 h-4" />
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              بر اساس {faNumber(total)} نظر
            </p>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => {
              const pct = total ? Math.round((counts[s] / total) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="w-6 shrink-0 flex items-center gap-0.5 text-slate-600 font-bold">
                    {faNumber(s)}
                    <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 24 24">
                      <path d={STAR_PATH}></path>
                    </svg>
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#8b5cf6] transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="w-8 shrink-0 text-left">{faNumber(pct)}٪</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* List toolbar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <h4 className="text-sm font-bold text-slate-800">همه‌ی نظرات</h4>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="مرتب‌سازی نظرات"
            className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
          >
            <option value="new">جدیدترین</option>
            <option value="high">بیشترین امتیاز</option>
            <option value="low">کمترین امتیاز</option>
          </select>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {sorted.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              هنوز نظری ثبت نشده. اولین نفر باشید!
            </p>
          ) : (
            sorted.map((r) => (
              <article key={r.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${colorFor(r.authorName)} flex items-center justify-center font-bold text-sm shrink-0`}>
                    {initials(r.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{r.authorName}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                          اجاره‌کننده‌ی تأییدشده
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{faDate(r.createdAt)}</span>
                    </div>
                    <div className="mt-1">
                      <StarsRow rating={r.rating} className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 text-justify whitespace-pre-line">
                      {r.comment}
                    </p>
                    {r.hostReply ? (
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#7c3aed] text-lg shrink-0 mt-0.5">reply</span>
                        <div className="text-xs leading-relaxed text-slate-600">
                          <strong className="text-[#7c3aed] block mb-0.5">پاسخ اجاره‌دهنده:</strong>
                          {r.hostReply}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-4 mt-2.5">
                      <button
                        type="button"
                        onClick={() => setLiked((m) => ({ ...m, [r.id]: !m[r.id] }))}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                          liked[r.id] ? "text-[#7c3aed]" : "text-slate-400 hover:text-[#7c3aed]"
                        }`}
                      >
                        <svg className={`w-4 h-4 stroke-current ${liked[r.id] ? "fill-[#ede9fe]" : ""}`} fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        مفید بود
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
        <span className="hidden" data-listing-id={listingId}></span>
      </div>
    </section>
  );
}

/* ------------------------------- Booking box ------------------------------- */

function BookingBox({
  data,
  viewerId,
  startIso,
  endIso,
  onRangeChange,
  bookedRanges,
  ownerBlockedRanges,
}: {
  data: ItemDetailData;
  viewerId: string | null;
  startIso: string | null;
  endIso: string | null;
  onRangeChange: (startIso: string | null, endIso: string | null) => void;
  bookedRanges: DateRange[];
  ownerBlockedRanges: DateRange[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isOwner = viewerId === data.owner.id;

  const startDate = startIso ?? "";
  const endDate = endIso ?? "";
  const nights =
    startDate && endDate && new Date(endDate) > new Date(startDate)
      ? daysBetween(startDate, endDate)
      : 0;
  const invalidRange = Boolean(startDate && endDate && nights === 0);
  const outOfBounds =
    nights > 0 && (nights < data.minDays || nights > data.maxDays);
  const subtotal = nights > 0 ? nights * data.dailyPrice : 0;

  async function submit() {
    if (!viewerId) {
      router.push(`/signin-otp?next=${encodeURIComponent(`/item-details/${data.id}`)}`);
      return;
    }
    if (!startDate || !endDate || invalidRange || outOfBounds) {
      toast.error("بازه اجاره را به‌درستی انتخاب کنید.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: data.id, startDate, endDate }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error ?? "ثبت درخواست اجاره انجام نشد.");
        return;
      }
      const reservation = payload?.reservation;
      toast.success(`درخواست اجاره با کد ${faNumber(reservation?.code ?? "")} ثبت شد.`);
      if (reservation?.id) router.push(`/rental-lifecycle/${reservation.id}`);
    } catch {
      toast.error("خطای شبکه؛ دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4 lg:sticky lg:top-24">
      {/* Jalali (Shamsi) date range picker — solar year ۱۴۰۵ */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">انتخاب تاریخ اجاره</span>
        <span className="text-[10px] font-semibold text-[#7c3aed]">تقویم شمسی ۱۴۰۵</span>
      </div>
      <JalaliCalendar
        startIso={startIso}
        endIso={endIso}
        onRangeChange={onRangeChange}
        bookedRanges={bookedRanges}
        ownerBlockedRanges={ownerBlockedRanges}
        minDays={data.minDays}
        maxDays={data.maxDays}
      />
      {/* Selected dates summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <span className="text-[10px] text-slate-500 block">تاریخ تحویل</span>
          <span className="text-xs font-bold text-slate-800">
            {startIso ? formatJalaliIso(startIso) : "—"}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <span className="text-[10px] text-slate-500 block">تاریخ بازگشت</span>
          <span className="text-xs font-bold text-slate-800">
            {endIso ? formatJalaliIso(endIso) : "—"}
          </span>
        </div>
      </div>
      {invalidRange ? (
        <p className="text-[11px] font-semibold text-rose-500">تاریخ بازگشت باید بعد از تاریخ تحویل باشد.</p>
      ) : null}
      {outOfBounds ? (
        <p className="text-[11px] font-semibold text-rose-500">
          مدت اجاره باید بین {faNumber(data.minDays)} و {faNumber(data.maxDays)} روز باشد.
        </p>
      ) : null}

      {/* Price preview */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 text-xs">
        <div className="flex items-center justify-between p-2.5">
          <span className="text-slate-500 font-medium">مدت اجاره</span>
          <span className="font-bold text-slate-800">
            {nights > 0 ? `${faNumber(nights)} روز` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between p-2.5">
          <span className="text-slate-500 font-medium">اجاره روزانه</span>
          <span className="font-bold text-slate-800">{faToman(data.dailyPrice)} تومان</span>
        </div>
        <div className="flex items-center justify-between p-2.5">
          <span className="text-slate-500 font-medium">ودیعه ضمانت (قابل استرداد)</span>
          <span className="font-bold text-slate-800">{faToman(data.deposit)} تومان</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">مبلغ نهایی اجاره:</span>
        <div className="text-left">
          <span className="text-xl font-black text-[#6d28d9]">
            {subtotal > 0 ? faToman(subtotal) : faToman(data.dailyPrice)}
          </span>
          <span className="text-xs font-semibold text-slate-500"> تومان</span>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={submitting || isOwner}
        title={isOwner ? "این وسیله متعلق به شماست" : undefined}
        className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-[#8b5cf6]/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
          <rect height="18" rx="2" ry="2" width="18" x="3" y="4"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
        </svg>
        <span>{isOwner ? "وسیله خودتان است" : submitting ? "در حال ثبت..." : "ثبت درخواست اجاره"}</span>
      </button>
      <p className="text-[11px] text-slate-500 leading-relaxed text-center">
        پرداخت در مرحله بعد به‌صورت آزمایشی (Sandbox) انجام می‌شود — هیچ پول
        واقعی جابه‌جا نمی‌شود.
      </p>
    </div>
  );
}

/* ---------------------------------- Root app ---------------------------------- */

export default function ItemDetailsApp({
  data,
  reviews,
  otherItems,
  viewerId,
  bookedRanges = [],
  ownerBlockedRanges = [],
  initialFaved = false,
}: {
  data: ItemDetailData;
  reviews: ReviewData[];
  otherItems: OwnerListingData[];
  viewerId: string | null;
  /** Existing non-cancelled reservations of this listing (ISO dates). */
  bookedRanges?: DateRange[];
  /** Days the owner blocked from the create-listing wizard (ISO dates). */
  ownerBlockedRanges?: DateRange[];
  /** Whether the signed-in viewer already saved this listing (Favorite table). */
  initialFaved?: boolean;
}) {
  const router = useRouter();
  const [contentTab, setContentTab] = useState<"desc" | "rules">("desc");
  const [faved, setFaved] = useState(initialFaved);
  const [faving, setFaving] = useState(false);
  const [chatting, setChatting] = useState(false);

  // Shared booking range: the availability calendar and the checkout box
  // both drive this state, and it is what gets POSTed to /api/reservations.
  const [startIso, setStartIso] = useState<string | null>(null);
  const [endIso, setEndIso] = useState<string | null>(null);
  const handleRangeChange = (s: string | null, e: string | null) => {
    setStartIso(s);
    setEndIso(e);
  };

  const specs = useMemo(
    () => (data.specs ?? "").split("•").map((s) => s.trim()).filter(Boolean),
    [data.specs],
  );
  const rulesList = useMemo(() => {
    if (data.rules) {
      return data.rules
        .split(/\n|•|؛/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [
      "امکان لغو تا ۲۴ ساعت قبل از تحویل با استرداد کامل وجه",
      "در صورت آسیب، هزینه تعمیر بر اساس ارزیابی کارشناسی محاسبه می‌شود.",
      "اجاره‌دهنده مسئول سلامت و تمیزی وسیله در زمان تحویل است.",
    ];
  }, [data.rules]);

  /** Persist the heart to the Favorite table (POST/DELETE /api/favorites).
      Guests are sent to login like the chat button; failures roll the UI
      back so the button never lies about the saved state. */
  async function toggleFav() {
    if (!viewerId) {
      router.push(`/signin-otp?next=${encodeURIComponent(`/item-details/${data.id}`)}`);
      return;
    }
    if (faving) return;
    setFaving(true);
    const next = !faved;
    setFaved(next);
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: data.id }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "به علاقه‌مندی‌ها اضافه شد." : "از علاقه‌مندی‌ها حذف شد.");
    } catch {
      setFaved(!next);
      toast.error("ثبت علاقه‌مندی انجام نشد؛ دوباره تلاش کنید.");
    } finally {
      setFaving(false);
    }
  }

  async function chatWithOwner() {
    if (!viewerId) {
      router.push(`/signin-otp?next=${encodeURIComponent(`/item-details/${data.id}`)}`);
      return;
    }
    setChatting(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: data.id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload?.error ?? "شروع گفتگو انجام نشد.");
        return;
      }
      router.push(`/live-chat?c=${payload.conversationId}`);
    } catch {
      toast.error("خطای شبکه؛ دوباره تلاش کنید.");
    } finally {
      setChatting(false);
    }
  }

  const deliveryText = `${data.city}${data.area ? `، ${data.area}` : ""} ${
    data.pickupInPerson ? "— تحویل حضوری" : ""
  }${data.deliveryCourier ? " + پیک اورا" : ""}`;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-16 w-full">
      <Toaster position="bottom-left" dir="rtl" />
      {/* Breadcrumb */}
      <section className="pt-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 font-medium">
          <nav className="flex items-center flex-wrap gap-2">
            <Link className="hover:text-[#7c3aed] transition-colors" href="/">
              خانه
            </Link>
            <span className="text-slate-300">/</span>
            <Link className="hover:text-[#7c3aed] transition-colors" href="/categories">
              دسته‌بندی‌ها
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              className="hover:text-[#7c3aed] transition-colors"
              href={`/categories?tab=${data.category.slug === "digital" ? "digital" : data.category.slug}`}
            >
              {data.category.name}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">{data.title}</span>
          </nav>
          <Link
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#7c3aed] transition-colors font-medium"
            href="/categories"
          >
            <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span>بازگشت به نتایج جستجو</span>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============ COLUMN 1: GALLERY & EXTRA DETAILS ============ */}
        <div className="lg:col-span-4 space-y-6">
          <Gallery images={data.images} title={data.title} />

          {/* Trust & Guarantee 4 Features Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "شناسنامه سلامت" },
                { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "بیمه اختیاری" },
                { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "قرارداد رسمی راحت" },
                { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", label: "پشتیبانی ۲۴/۷" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center mb-1.5">
                    <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                      <path d={f.icon} strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Area Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7c3aed]"></span>
                محدوده تحویل
              </h3>
              <span className="text-xs text-slate-500 font-medium">{deliveryText}</span>
            </div>
            <div className="h-28 bg-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-200/60">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="w-9 h-9 rounded-full bg-[#7c3aed]/20 flex items-center justify-center animate-pulse">
                <div className="w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center text-white shadow-md">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                  </svg>
                </div>
              </div>
              <button
                type="button"
                disabled
                title="به‌زودی"
                className="absolute bottom-2.5 right-2.5 bg-white/95 px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 shadow border border-slate-200/80 cursor-not-allowed"
              >
                مشاهده روی نقشه
              </button>
            </div>
          </div>

          {/* Other Items by Owner */}
          {otherItems.length > 0 ? (
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#7c3aed] stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  سایر وسایل همین اجاره‌دهنده
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {otherItems.map((o) => (
                  <Link
                    key={o.id}
                    href={`/item-details/${o.id}`}
                    className="p-2.5 rounded-xl border border-slate-200/70 hover:border-[#ddd6fe] transition-all hover:shadow-sm group"
                  >
                    <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden mb-2">
                      <img
                        alt={o.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={o.imageUrl}
                      />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">{o.title}</h4>
                    <p className="text-xs font-bold text-[#7c3aed]">
                      {faToman(o.dailyPrice)}
                      <span className="text-[10px] text-slate-500 font-normal"> تومان/روز</span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Assurance CTA Banner */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-[#ede9fe]/90 to-[#f5f3ff] border border-[#ddd6fe] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow">
                <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#4c1d95]">با خیال راحت اجاره کن!</h4>
                <p className="text-[11px] text-[#6d28d9]">تمام وسایل قبل از تحویل بررسی و تایید می‌شوند.</p>
              </div>
            </div>
            <Link
              href="/how-it-works"
              className="shrink-0 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              اطلاعات بیشتر
            </Link>
          </div>
        </div>

        {/* ============ COLUMN 2: PRODUCT DETAILS & SPECS ============ */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Product Title & Brief Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug">{data.title}</h2>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-amber-500 fill-current" viewBox="0 0 24 24">
                    <path d={STAR_PATH}></path>
                  </svg>
                  <span>{faNumber(data.rating.toFixed(1))}</span>
                  <span className="text-slate-400 font-normal">({faNumber(data.reviewsCount)} نظر)</span>
                </button>
                <span className="inline-flex items-center gap-1 bg-[#f5f3ff] text-[#6d28d9] px-2 py-0.5 rounded-md text-xs font-semibold border border-[#ddd6fe]/60">
                  تأیید هویت
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{data.description}</p>

            {/* 4 Grid Key Feature Highlights */}
            {specs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {specs.slice(0, 4).map((s, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                    <div className="w-8 h-8 mx-auto mb-1 text-[#7c3aed] flex items-center justify-center">
                      <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </div>
                    <span className="block text-xs font-bold text-slate-800 line-clamp-2">{s}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() =>
                document.getElementById("specs-table")?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[#7c3aed] hover:text-[#6d28d9] transition-colors pt-1"
            >
              <span>مشاهده مشخصات کامل</span>
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Pricing & Guarantee Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                {data.instantBook ? (
                  <span className="inline-block bg-[#7c3aed] text-white text-[11px] font-bold px-2 py-0.5 rounded-md mb-1 shadow-sm">
                    تحویل فوری
                  </span>
                ) : null}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#6d28d9]">{faToman(data.dailyPrice)}</span>
                  <span className="text-xs font-semibold text-slate-600">تومان / روز</span>
                </div>
                {data.weeklyPrice ? (
                  <p className="text-xs text-slate-500 font-medium">
                    اجاره هفتگی: <span className="font-bold text-slate-700">{faToman(data.weeklyPrice)} تومان</span>
                  </p>
                ) : null}
              </div>
              <div className="sm:text-left border-t sm:border-t-0 sm:border-r sm:pr-6 border-slate-100 pt-3 sm:pt-0">
                <span className="text-xs font-bold text-slate-600 block mb-0.5">ودیعه ضمانت</span>
                <span className="text-lg font-bold text-slate-800 block">{faToman(data.deposit)} تومان</span>
                <span className="text-[11px] text-slate-400 font-medium">(قابل استرداد پس از بازگشت سالم)</span>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center border-b border-slate-200 px-4 pt-3 overflow-x-auto no-scrollbar gap-2 sm:gap-6 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setContentTab("desc")}
                className={`pb-3 shrink-0 ${
                  contentTab === "desc"
                    ? "text-[#7c3aed] border-b-2 border-[#7c3aed] font-bold"
                    : "text-slate-500 hover:text-slate-800 transition-colors"
                }`}
              >
                توضیحات
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="pb-3 text-slate-500 hover:text-slate-800 shrink-0 transition-colors"
              >
                نظرات کاربران
              </button>
              <button
                type="button"
                onClick={() => setContentTab("rules")}
                className={`pb-3 shrink-0 ${
                  contentTab === "rules"
                    ? "text-[#7c3aed] border-b-2 border-[#7c3aed] font-bold"
                    : "text-slate-500 hover:text-slate-800 transition-colors"
                }`}
              >
                شرایط اجاره
              </button>
              <Link
                href="/tos-support-faq"
                className="pb-3 text-slate-500 hover:text-slate-800 shrink-0 transition-colors"
              >
                سوالات متداول
              </Link>
            </div>
            {/* Active Tab Content */}
            <div className="p-5 space-y-5">
              {contentTab === "desc" ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800">درباره این وسیله</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                      {data.description}
                    </p>
                  </div>
                  {specs.length > 0 ? (
                    <div className="pt-4 border-t border-slate-100" id="specs-table">
                      <h3 className="text-sm font-bold text-slate-800 mb-3">مشخصات فنی</h3>
                      <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                        {specs.map((s, idx) => (
                          <div
                            key={idx}
                            className={`grid grid-cols-2 p-2.5 ${idx % 2 === 0 ? "bg-slate-50/70" : "bg-white"} ${
                              idx < specs.length - 1 ? "border-b border-slate-100" : ""
                            }`}
                          >
                            <span className="text-slate-500 font-medium">ویژگی {faNumber(idx + 1)}</span>
                            <span className="text-slate-800 font-semibold">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-800">شرایط و قوانین اجاره</h3>
                  {rulesList.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span className="leading-relaxed">{rule}</span>
                    </div>
                  ))}
                  <div className="rounded-xl bg-[#f5f3ff] border border-[#ddd6fe] p-3 text-[11px] text-[#4c1d95] leading-relaxed">
                    پرداخت مبلغ اجاره و ودیعه در مرحله بعد به‌صورت آزمایشی (Sandbox) انجام می‌شود — هیچ پول واقعی جابه‌جا نمی‌شود.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <ReviewsSection listingId={data.id} reviews={reviews} rating={data.rating} />
        </div>

        {/* ============ COLUMN 3: HOST CARD & BOOKING ACTIONS ============ */}
        <div className="lg:col-span-3 space-y-6">
          {/* Owner Profile Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 p-1.5 rounded-full bg-slate-200 border-2 border-[#8b5cf6] overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500 text-lg">
                {initials(data.owner.name)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-800">{data.owner.name}</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="آنلاین"></span>
                </div>
                <p className="text-xs text-[#7c3aed] font-semibold">
                  {data.owner.isHost ? "میزبان حرفه‌ای" : "اجاره‌دهنده"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                  <span className="text-amber-500 font-bold">★ {faNumber(data.rating.toFixed(1))}</span>
                  <span>({faNumber(data.reviewsCount)} نظر ثبت‌شده)</span>
                </div>
              </div>
            </div>
            {/* Trust Badges List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  هویت تایید شده
                </span>
                <span className="text-slate-400 font-medium">پاسخگویی سریع</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="12 6 12 12 14 14"></polyline>
                    <circle cx="12" cy="12" r="9"></circle>
                  </svg>
                  بدون اختلاف حل‌نشده
                </span>
                <span className="text-slate-400 font-medium">سابقه اجاره عالی</span>
              </div>
            </div>
            {/* Contact Host Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={chatWithOwner}
                disabled={chatting || viewerId === data.owner.id}
                title={viewerId === data.owner.id ? "گفتگو با خودتان معنی ندارد" : undefined}
                className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span>{chatting ? "در حال اتصال..." : "گفتگو با مالک"}</span>
              </button>
              <button
                type="button"
                onClick={toggleFav}
                disabled={faving}
                className={`w-full font-semibold py-2 px-4 rounded-xl text-xs border flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 ${
                  faved
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <svg
                  className={`w-4 h-4 stroke-current ${faved ? "fill-rose-500 text-rose-500" : "text-slate-500"}`}
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                <span>{faved ? "به علاقه‌مندی‌ها اضافه شد" : "افزودن به علاقه‌مندی‌ها"}</span>
              </button>
            </div>
          </div>

          {/* Availability Calendar Box — interactive Jalali calendar wired to real reservations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">تقویم دسترسی</h3>
              <span className="text-xs font-semibold text-[#7c3aed]">شمسی — سال ۱۴۰۵</span>
            </div>
            <JalaliCalendar
              startIso={startIso}
              endIso={endIso}
              onRangeChange={handleRangeChange}
              bookedRanges={bookedRanges}
              ownerBlockedRanges={ownerBlockedRanges}
              minDays={data.minDays}
              maxDays={data.maxDays}
            />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                موجود
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                در حال اجاره
              </span>
              {ownerBlockedRanges.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300"></span>
                  مسدود میزبان
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]"></span>
                انتخاب‌شده
              </span>
            </div>
            {/* Rules / Rental Terms Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed">
              {rulesList.slice(0, 3).map((rule, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <svg
                    className={`w-4 h-4 shrink-0 mt-0.5 stroke-current ${idx === 1 ? "text-amber-500" : "text-[#7c3aed]"}`}
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    {idx === 1 ? (
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"></path>
                    ) : (
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                    )}
                  </svg>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Action Card (sticky) */}
          <BookingBox
            data={data}
            viewerId={viewerId}
            startIso={startIso}
            endIso={endIso}
            onRangeChange={handleRangeChange}
            bookedRanges={bookedRanges}
            ownerBlockedRanges={ownerBlockedRanges}
          />
        </div>
      </div>
    </main>
  );
}
