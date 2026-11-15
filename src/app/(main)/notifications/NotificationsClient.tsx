"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { faTimeAgo, toPersianDigits } from "@/lib/format";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

/* Type chip metadata — same type vocabulary the rest of the app writes into
   the Notification table (RESERVATION | MESSAGE | REVIEW | LISTING |
   DISPUTE | SYSTEM). */
const TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode; ring: string }
> = {
  RESERVATION: {
    label: "رزرو",
    ring: "bg-primary-soft text-primary",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
  },
  MESSAGE: {
    label: "پیام",
    ring: "bg-primary-soft text-primary",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
  },
  REVIEW: {
    label: "نظر",
    ring: "bg-amber-50 text-accent-gold",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
  },
  LISTING: {
    label: "آگهی",
    ring: "bg-primary-soft text-primary",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
  },
  DISPUTE: {
    label: "اختلاف",
    ring: "bg-red-50 text-red-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path d="M12 3v18M3 7l4-4 4 4M5 3v6m10-2l4-4 4 4m-2-2v8a2 2 0 01-2 2h-4" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
  },
  SYSTEM: {
    label: "سیستمی",
    ring: "bg-purple-50 text-primary-light",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
  },
};

type Filter = "all" | "unread";

/**
 * Notifications page body — list, filter (همه / خوانده‌نشده), mark one or
 * all read. Same visual language as the site: rounded-3xl purple-border
 * cards, soft-purple highlights, Persian numerals and relative times.
 */
export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: NotificationRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = items.filter((n) => !n.read).length;
  const visible = filter === "all" ? items : items.filter((n) => !n.read);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.notifications)) {
        setItems(data.notifications);
        // Refresh the header bell badge (server component counter).
        router.refresh();
      }
    } catch {
      /* keep showing the current list; network errors surface on actions */
    }
  }, [router]);

  async function markOne(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("ثبت وضعیت خوانده‌شده انجام نشد؛ دوباره تلاش کنید.");
      void reload();
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("همه اعلان‌ها خوانده‌شده علامت گذاری شدند.");
      router.refresh();
    } catch {
      toast.error("علامت‌گذاری اعلان‌ها انجام نشد؛ دوباره تلاش کنید.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <main className="flex-1 w-full">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 pb-10 flex flex-col gap-5">
        {/* Page title card — same rounded-3xl purple-border language */}
        <section className="bg-white rounded-3xl border border-purple-100 shadow-card p-5 md:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-xs shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-lg md:text-xl font-black text-neutral-text">
                  اعلان‌ها
                </h1>
                <p className="text-xs text-neutral-muted font-medium">
                  {unreadCount > 0
                    ? `${toPersianDigits(unreadCount)} اعلان خوانده‌نشده دارید`
                    : "همه اعلان‌ها خوانده شده‌اند"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter pills — same style as the site's tab chips */}
              <div className="flex items-center rounded-full border border-purple-100 bg-primary-surface p-1">
                {(
                  [
                    { key: "all", label: "همه" },
                    { key: "unread", label: "خوانده‌نشده" },
                  ] as { key: Filter; label: string }[]
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFilter(t.key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      filter === t.key
                        ? "bg-primary text-white shadow-sm shadow-primary/30"
                        : "text-neutral-muted hover:text-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll || unreadCount === 0}
                className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markingAll ? "در حال ثبت…" : "علامت‌گذاری همه به‌عنوان خوانده‌شده"}
              </button>
            </div>
          </div>
        </section>

        {/* List */}
        {visible.length === 0 ? (
          <section className="bg-white rounded-3xl border border-purple-100 shadow-card p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary-soft text-primary flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-neutral-text">
                {filter === "unread"
                  ? "اعلان خوانده‌نشده‌ای ندارید"
                  : "فعلاً اعلانی ندارید"}
              </h2>
              <p className="text-xs text-neutral-muted leading-relaxed max-w-sm">
                رویدادهای رزرو، پیام‌ها، نظرات و آگهی‌ها به محض رخ دادن همین‌جا
                نمایش داده می‌شوند.
              </p>
            </div>
            <Link
              href="/categories"
              className="px-5 py-2.5 rounded-full bg-primary-soft text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
            >
              مشاهده وسایل اجاره‌ای
            </Link>
          </section>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
              return (
                <li
                  key={n.id}
                  className={`rounded-3xl border p-4 md:p-5 transition-colors ${
                    n.read
                      ? "bg-white border-purple-100 shadow-card"
                      : "bg-primary-surface border-purple-200 shadow-card"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.ring}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-sm font-bold text-neutral-text">
                          {n.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${meta.ring}`}
                        >
                          {meta.label}
                        </span>
                        {!n.read ? (
                          <span
                            className="w-2 h-2 rounded-full bg-primary shrink-0"
                            title="خوانده‌نشده"
                          ></span>
                        ) : null}
                      </div>
                      <p className="text-xs text-neutral-muted leading-relaxed">
                        {n.body}
                      </p>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[11px] text-neutral-muted/80">
                          {faTimeAgo(n.createdAt)}
                        </span>
                        <div className="flex items-center gap-3">
                          {!n.read ? (
                            <button
                              type="button"
                              onClick={() => markOne(n.id)}
                              className="text-[11px] font-bold text-neutral-muted hover:text-primary transition-colors"
                            >
                              علامت‌گذاری به‌عنوان خوانده‌شده
                            </button>
                          ) : null}
                          {n.link ? (
                            <Link
                              href={n.link}
                              className="px-3.5 py-1.5 rounded-full bg-primary-soft text-primary text-[11px] font-bold hover:bg-primary hover:text-white transition-colors"
                            >
                              مشاهده
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
