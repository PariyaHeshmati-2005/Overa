"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { faTimeAgo } from "@/lib/format";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, string> = {
  RESERVATION: "calendar_today",
  MESSAGE: "chat",
  REVIEW: "star",
  LISTING: "shopping_bag",
  DISPUTE: "gavel",
  SYSTEM: "info",
};

/**
 * Live notifications list (GET /api/notifications) with Persian dates and
 * «علامت‌گذاری همه به‌عنوان خوانده‌شده» → POST /api/notifications.
 */
export default function NotificationsPanel() {
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "خطا در دریافت اعلان‌ها.");
        setItems([]);
        return;
      }
      setItems(data.notifications ?? []);
      setError("");
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    setMarking(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
      }
    } finally {
      setMarking(false);
    }
  }

  const unread = items?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface">
          {items === null
            ? "در حال بارگذاری اعلان‌ها…"
            : unread > 0
              ? `${unread} اعلان خوانده‌نشده`
              : "همه اعلان‌ها خوانده شده‌اند"}
        </span>
        <button
          className="px-3 py-1.5 rounded-xl bg-m3-primary text-white text-[11px] font-bold hover:bg-m3-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={marking || unread === 0}
          onClick={markAllRead}
          type="button"
        >
          {marking ? "در حال ثبت…" : "علامت‌گذاری همه به‌عنوان خوانده‌شده"}
        </button>
      </div>
      {error ? (
        <p className="text-xs font-bold text-m3-error bg-m3-error-container rounded-xl px-3 py-2">
          {error}
        </p>
      ) : null}
      {items !== null && items.length === 0 ? (
        <p className="text-xs text-on-surface-variant bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 text-center">
          فعلاً اعلانی ندارید؛ رویدادهای رزرو و پیام‌ها اینجا نمایش داده می‌شوند.
        </p>
      ) : null}
      <ul className="space-y-2">
        {items?.map((n) => {
          const icon = TYPE_ICONS[n.type] ?? "notifications";
          return (
            <li
              key={n.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                n.read
                  ? "bg-surface-container-lowest border-outline-variant/30 opacity-75"
                  : "bg-primary-fixed/40 border-m3-primary/30"
              }`}
            >
              <span
                className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                  n.read ? "bg-surface-container text-on-surface-variant" : "bg-m3-primary/10 text-m3-primary"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
              </span>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface">{n.title}</span>
                  {!n.read ? (
                    <span className="size-2 rounded-full bg-m3-primary shrink-0" title="خوانده‌نشده"></span>
                  ) : null}
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{n.body}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-on-surface-variant/80">
                    {faTimeAgo(n.createdAt)}
                  </span>
                  {n.link ? (
                    <Link
                      className="text-[11px] font-bold text-m3-primary hover:underline"
                      href={n.link}
                    >
                      مشاهده
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
