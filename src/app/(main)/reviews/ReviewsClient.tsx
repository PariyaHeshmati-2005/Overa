"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { faDateTime, faNumber, toPersianDigits } from "@/lib/format";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  hostReply: string | null;
  hostReplyAt: string | null;
  author: { id: string; name: string };
  listing: { id: string; title: string; image: string | null };
  reservationCode: string | null;
};

type Props = {
  reviews: ReviewItem[];
  listings: { id: string; title: string }[];
};

const PAGE_SIZE = 5;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-lg ${i <= rating ? "" : "text-outline-variant"}`}
          style={
            i <= rating ? { fontVariationSettings: '"FILL" 1' } : undefined
          }
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function ReviewsClient({ reviews, listings }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [listingId, setListingId] = useState("all");
  const [rating, setRating] = useState("all");
  const [sort, setSort] = useState("newest");
  const [quick, setQuick] = useState<"all" | "needs-reply">("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ratingCounts = useMemo(() => {
    const c: Record<string, number> = {
      all: reviews.length,
      "5": 0,
      "4": 0,
      "3": 0,
      "needs-reply": 0,
    };
    for (const r of reviews) {
      if (r.rating === 5) c["5"] += 1;
      if (r.rating === 4) c["4"] += 1;
      if (r.rating === 3) c["3"] += 1;
      if (!r.hostReply) c["needs-reply"] += 1;
    }
    return c;
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (listingId !== "all")
      list = list.filter((r) => r.listing.id === listingId);
    if (quick === "needs-reply") list = list.filter((r) => !r.hostReply);
    else if (rating !== "all" && rating !== "needs-reply")
      list = list.filter((r) => r.rating === Number(rating));
    if (q.trim()) {
      const needle = q.trim();
      list = list.filter(
        (r) =>
          r.comment.includes(needle) ||
          r.author.name.includes(needle) ||
          (r.reservationCode ?? "").includes(needle) ||
          r.listing.title.includes(needle),
      );
    }
    if (sort === "newest")
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sort === "highest") list.sort((a, b) => b.rating - a.rating);
    else if (sort === "lowest") list.sort((a, b) => a.rating - b.rating);
    else if (sort === "unanswered")
      list.sort(
        (a, b) => Number(Boolean(a.hostReply)) - Number(Boolean(b.hostReply)),
      );
    return list;
  }, [reviews, listingId, rating, quick, q, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function submitReply(reviewId: string) {
    const text = replyText.trim();
    if (text.length < 2) {
      toast.error("متن پاسخ کوتاه است.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "ثبت پاسخ ممکن نشد.");
        return;
      }
      toast.success("پاسخ ثبت شد");
      setEditingId(null);
      setReplyText("");
      router.refresh();
    } catch {
      toast.error("خطا در ثبت پاسخ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Toaster position="top-center" richColors />

      {/* Filters & Search Toolbar — source composition */}
      <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="w-full pr-10 pl-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-m3-primary focus:border-transparent transition-all"
              placeholder="جستجو در متن نظر، نام مستاجر، کد سفارش..."
              type="text"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={listingId}
              onChange={(e) => {
                setListingId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto appearance-none bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary cursor-pointer min-w-[170px]"
            >
              <option value="all">
                تمام کالاها ({faNumber(listings.length)} مورد فعال)
              </option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <select
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                setQuick("all");
                setPage(1);
              }}
              className="w-full sm:w-auto appearance-none bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary cursor-pointer min-w-[150px]"
            >
              <option value="all">همه امتیازها</option>
              <option value="5">۵ ستاره ({faNumber(ratingCounts["5"])})</option>
              <option value="4">۴ ستاره ({faNumber(ratingCounts["4"])})</option>
              <option value="3">۳ ستاره ({faNumber(ratingCounts["3"])})</option>
              <option value="needs-reply">
                فقط نیازمند پاسخ ({faNumber(ratingCounts["needs-reply"])})
              </option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary cursor-pointer min-w-[150px]"
            >
              <option value="newest">جدیدترین نظرات</option>
              <option value="highest">بالاترین امتیاز</option>
              <option value="lowest">پایین‌ترین امتیاز</option>
              <option value="unanswered">نظرات بدون پاسخ میزبان</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setListingId("all");
                setRating("all");
                setQuick("all");
                setSort("newest");
                setPage(1);
              }}
              className="size-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-m3-primary hover:bg-surface-container-high transition-colors"
              title="بازنشانی فیلترها"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>
        </div>
        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-container overflow-x-auto text-xs">
          <span className="text-on-surface-variant font-medium shrink-0">
            فیلترهای سریع:
          </span>
          <button
            type="button"
            onClick={() => {
              setQuick("all");
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full font-medium shrink-0 ${
              quick === "all"
                ? "bg-m3-primary text-white"
                : "bg-surface-container text-on-surface-variant hover:text-m3-primary hover:bg-surface-container-high"
            }`}
          >
            همه ({faNumber(reviews.length)})
          </button>
          <button
            type="button"
            onClick={() => {
              setQuick("needs-reply");
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full font-medium shrink-0 flex items-center gap-1 ${
              quick === "needs-reply"
                ? "bg-m3-primary text-white"
                : "bg-amber-100 text-amber-900 border border-amber-300"
            }`}
          >
            <span className="size-1.5 rounded-full bg-amber-500"></span>
            نیازمند پاسخ میزبان ({faNumber(ratingCounts["needs-reply"])} مورد)
          </button>
        </div>
      </section>

      {/* Review Cards */}
      <div className="space-y-6">
        {shown.map((r) => {
          const editing = editingId === r.id;
          return (
            <article
              key={r.id}
              className={`rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${
                !r.hostReply
                  ? "bg-surface-container-lowest border-2 border-m3-primary/30 relative overflow-hidden"
                  : "bg-surface-container-lowest border border-outline-variant/60"
              }`}
            >
              {!r.hostReply && (
                <div className="absolute top-0 left-0 bg-m3-primary text-white text-[10px] font-bold px-3 py-1 rounded-br-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">
                    notifications_active
                  </span>
                  نیازمند پاسخ سریع میزبان
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-surface-container pb-4 pt-1">
                {/* Author & item info */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="size-14 rounded-full bg-surface-container border-2 border-primary-fixed-dim flex items-center justify-center text-m3-primary font-black text-lg">
                      {r.author.name?.trim()?.[0] ?? "ک"}
                    </div>
                    <span
                      className="absolute -bottom-1 -left-1 size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]"
                      title="مستاجر تایید هویت شده"
                    >
                      <span
                        className="material-symbols-outlined text-xs"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        check
                      </span>
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-on-surface">
                        {r.author.name}
                      </h4>
                      <span className="text-xs text-on-surface-variant font-medium">
                        | مستاجر اٌوِرا
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-m3-primary">
                        calendar_today
                      </span>
                      تاریخ ثبت نظر: {faDateTime(r.createdAt)}
                      {r.reservationCode && (
                        <>
                          <span className="text-outline-variant">●</span>
                          <span>
                            کد رزرو:{" "}
                            <strong className="text-on-surface font-mono">
                              #{r.reservationCode}
                            </strong>
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {/* Item thumbnail badge */}
                <div className="flex items-center gap-3 bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/40 shrink-0">
                  {r.listing.image ? (
                    <img
                      alt={r.listing.title}
                      className="size-12 object-cover rounded-md border border-outline-variant/60"
                      src={r.listing.image}
                    />
                  ) : (
                    <div className="size-12 rounded-md border border-outline-variant/60 bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">
                        package_2
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-on-surface-variant">
                      کالای اجاره‌شده:
                    </p>
                    <h5 className="text-xs font-bold text-on-surface">
                      {r.listing.title}
                    </h5>
                  </div>
                </div>
              </div>

              {/* Rating stars */}
              <div className="flex flex-wrap items-center justify-between gap-3 my-4">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-sm font-bold text-on-surface">
                    {toPersianDigits(r.rating)}.۰ از ۵
                  </span>
                </div>
              </div>

              {/* Review body */}
              <p className="text-sm leading-relaxed text-on-surface/90 mb-4">
                «{r.comment}»
              </p>

              {/* Official host reply (existing) */}
              {r.hostReply && !editing && (
                <div className="bg-surface-container-low border border-m3-primary/20 rounded-xl p-4 mr-4 md:mr-8 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-m3-primary text-base"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        reply
                      </span>
                      <span className="text-xs font-bold text-m3-primary">
                        پاسخ رسمی میزبان (شما):
                      </span>
                      {r.hostReplyAt && (
                        <span className="text-[11px] text-on-surface-variant">
                          {r.hostReplyAt}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(r.id);
                        setReplyText(r.hostReply ?? "");
                      }}
                      className="text-xs text-on-surface-variant hover:text-m3-primary flex items-center gap-1 font-medium"
                    >
                      <span className="material-symbols-outlined text-xs">
                        edit
                      </span>
                      ویرایش پاسخ
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    «{r.hostReply}»
                  </p>
                </div>
              )}

              {/* Reply editor (new or editing) */}
              {editing && (
                <div className="bg-surface-container-low/70 border border-outline-variant/60 rounded-xl p-4 mr-4 md:mr-8 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                      <span className="material-symbols-outlined text-m3-primary text-base">
                        rate_review
                      </span>
                      <span>
                        {r.hostReply
                          ? "ویرایش پاسخ ثبت‌شده:"
                          : "پاسخ میزبان به این بازخورد:"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setReplyText("");
                      }}
                      className="text-xs text-on-surface-variant hover:text-m3-primary font-medium"
                    >
                      انصراف
                    </button>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full p-3 text-xs bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    placeholder="متن پاسخ خود را به این نظر بنویسید..."
                  ></textarea>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => submitReply(r.id)}
                      disabled={submitting}
                      className="px-4 py-1.5 rounded-lg bg-m3-primary text-white text-xs font-bold hover:bg-primary-container transition-colors shadow-sm disabled:opacity-60"
                    >
                      {submitting
                        ? "در حال ثبت..."
                        : r.hostReply
                          ? "ذخیره ویرایش پاسخ"
                          : "ثبت و ارسال نهایی پاسخ"}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick reply for unanswered reviews */}
              {!r.hostReply && !editing && (
                <div className="bg-surface-container rounded-xl p-4 mr-4 md:mr-8 mb-3 border border-m3-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-m3-primary text-sm">
                        chat
                      </span>
                      ارسال پاسخ سریع:
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      برای ارتقای نرخ پاسخ‌گویی به ۱۰۰٪ پاسخ دهید
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitReply(r.id);
                      }}
                      className="w-full pl-28 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      placeholder="مثال: ممنون از امانت‌داری و بازخورد دقیق شما..."
                      type="text"
                    />
                    <button
                      type="button"
                      onClick={() => submitReply(r.id)}
                      disabled={submitting}
                      className="absolute left-1.5 top-1.5 px-3 py-1 bg-m3-primary text-white rounded-md text-xs font-bold hover:bg-primary-container transition-colors disabled:opacity-60"
                    >
                      {submitting ? "..." : "ارسال پاسخ"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-on-surface-variant">
                    <span>الگوهای آماده پاسخ سریع:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyText(
                          "ممنون از امانت‌داری شما؛ خوشحالیم که راضی بودید.",
                        )
                      }
                      className="text-m3-primary hover:underline font-medium"
                    >
                      «تشکر از امانت‌داری شما»
                    </button>
                    <span>●</span>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyText(
                          "خوشحالم که سفر خاطره‌انگیزی داشتید؛ منتظر دیدار دوباره هستیم.",
                        )
                      }
                      className="text-m3-primary hover:underline font-medium"
                    >
                      «خوشحالم سفر خاطره‌انگیزی بود»
                    </button>
                  </div>
                </div>
              )}

              {/* Actions footer */}
              <div className="flex items-center justify-between pt-2 text-xs text-on-surface-variant">
                <button
                  className="flex items-center gap-1.5 hover:text-m3-primary transition-colors disabled:opacity-60"
                  disabled
                  title="به‌زودی"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    thumb_up
                  </span>
                  <span>مفید بود</span>
                </button>
                {r.hostReply ? (
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      done_all
                    </span>
                    پاسخ داده شده
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      hourglass_empty
                    </span>
                    در انتظار پاسخ میزبان
                  </span>
                )}
              </div>
            </article>
          );
        })}

        {shown.length === 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-10 shadow-sm flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant">
              rate_review
            </span>
            <p className="text-sm font-bold text-on-surface">
              دیدگاهی مطابق فیلترهای انتخابی یافت نشد
            </p>
            <p className="text-xs text-on-surface-variant">
              فیلترها را بازنشانی کنید یا منتظر دیدگاه‌های جدید بمانید.
            </p>
          </div>
        )}
      </div>

      {/* Pagination bar — source composition */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4">
        <p className="text-xs text-on-surface-variant font-medium">
          نمایش{" "}
          {faNumber(filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1)}{" "}
          تا {faNumber(Math.min(current * PAGE_SIZE, filtered.length))} از{" "}
          {faNumber(filtered.length)} نظر ثبت‌شده
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current <= 1}
            className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-m3-primary disabled:opacity-50"
            title="قبلی"
          >
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
          </button>
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`size-8 rounded-lg text-xs font-bold ${
                current === i + 1
                  ? "bg-m3-primary text-white"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {toPersianDigits(i + 1)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={current >= pages}
            className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-m3-primary disabled:opacity-50"
            title="بعدی"
          >
            <span className="material-symbols-outlined text-base">
              chevron_left
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
