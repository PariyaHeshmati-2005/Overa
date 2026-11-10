"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { faTimeAgo } from "@/lib/format";

type NotificationDTO = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

/**
 * Notification bell with a real dropdown fed by GET /api/notifications.
 * Keeps the source's bell button classes and badge position; the badge shows
 * the signed-in user's real unread count.
 */
export default function NotificationsBell({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDTO[] | null>(null);
  const [unread, setUnread] = useState(unreadCount);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
    setUnread(0);
  }

  async function openItem(n: NotificationDTO) {
    if (!n.read) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) void load();
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-purple-600 hover:bg-purple-50 border border-slate-100 transition relative"
          aria-label="اعلان‌ها"
          title="اعلان‌ها"
        >
          {unread > 0 && (
            <span className="absolute top-0 left-7 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {new Intl.NumberFormat("fa-IR").format(unread)}
            </span>
          )}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            ></path>
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-2">
        <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800">اعلان‌ها</span>
          <button
            onClick={markAll}
            className="text-[11px] font-semibold text-purple-600 hover:text-purple-700"
          >
            علامت‌گذاری همه به‌عنوان خوانده‌شده
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto mt-1">
          {loading && (
            <p className="text-xs text-slate-400 text-center py-4">در حال دریافت…</p>
          )}
          {!loading && items && items.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">اعلان جدیدی ندارید.</p>
          )}
          {!loading &&
            items?.map((n) => (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={`w-full text-right flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors ${
                  n.read ? "opacity-70" : ""
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {!n.read && <span className="size-1.5 rounded-full bg-rose-500"></span>}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {faTimeAgo(n.createdAt)}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed">{n.body}</span>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
