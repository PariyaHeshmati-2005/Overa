"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { faTimeAgo, toPersianDigits, faToman } from "@/lib/format";

type Conversation = {
  id: string;
  lastReadAt: string;
  listing: { id: string; title: string; images: { url: string }[] } | null;
  other: { id: string; name: string } | null;
  reservationId: string | null;
  lastMessage: { id: string; senderId: string; body: string; createdAt: string } | null;
  unread: number;
};

type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
  sender: { id: string; name: string };
};

function timeFa(iso: string) {
  try {
    return toPersianDigits(
      new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)),
    );
  } catch {
    return "";
  }
}

function InitialAvatar({ name, size = "w-12 h-12", tone = "grad" }: { name: string; size?: string; tone?: "grad" | "solid" }) {
  const initial = name?.trim()?.[0] ?? "؟";
  return (
    <div
      className={
        size +
        " rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 " +
        (tone === "grad"
          ? "bg-gradient-to-br from-m3-primary to-primary-container"
          : "bg-primary-container")
      }
    >
      <span className="font-bold">{initial}</span>
    </div>
  );
}

export default function LiveChatClient({ myUserId, myName }: { myUserId: string; myName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialC = searchParams.get("c");

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialC);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedIdRef = useRef<string | null>(initialC);
  selectedIdRef.current = selectedId;

  /* ------------------------------ data loading ------------------------------ */

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "خطا در دریافت گفتگوها");
      setConversations(body.conversations ?? []);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطای نامشخص");
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "خطا در دریافت پیام‌ها");
      setMessages(body.messages ?? []);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطای نامشخص");
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    // poll messages + conversation list every 4s while a conversation is open
    const interval = setInterval(() => {
      if (selectedIdRef.current) loadMessages(selectedIdRef.current);
      loadConversations();
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedId, loadMessages, loadConversations]);

  useEffect(() => {
    // keep the newest message in view
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const selected = useMemo(
    () => conversations?.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  function select(id: string) {
    setSelectedId(id);
    setMessages([]);
    router.replace(`/live-chat?c=${id}`, { scroll: false });
  }

  async function send() {
    const body = text.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setErr(payload?.error ?? "ارسال پیام ناموفق بود.");
        return;
      }
      setText("");
      if (payload.message) setMessages((m) => [...m, payload.message]);
      loadConversations();
    } catch {
      setErr("ارتباط با سرور برقرار نشد.");
    } finally {
      setSending(false);
    }
  }

  const filteredList = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!conversations) return null;
    if (!q) return conversations;
    return conversations.filter((c) => {
      const hay = `${c.other?.name ?? ""} ${c.listing?.title ?? ""} ${c.lastMessage?.body ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [conversations, listSearch]);

  const totalUnread = (conversations ?? []).reduce((s, c) => s + (c.unread ? 1 : 0), 0);

  /* --------------------------------- render --------------------------------- */

  return (
    <>
      {/* Top breadcrumb & quick indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 px-2">
        <div className="flex items-center gap-2 text-xs md:text-sm text-on-surface-variant font-medium flex-wrap">
          <span>اورا</span>
          <span className="material-symbols-outlined text-[16px] text-m3-outline">chevron_left</span>
          <span>پیام‌ها و چت آنلاین</span>
          <span className="material-symbols-outlined text-[16px] text-m3-outline">chevron_left</span>
          <span className="text-m3-primary font-bold">
            {selected
              ? `${selected.other?.name ?? "کاربر"}${selected.listing ? ` (${selected.listing.title})` : ""}`
              : "صندوق پیام‌ها"}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full border border-surface-variant">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            همگام‌سازی زنده هر {toPersianDigits(4)} ثانیه فعال است
          </span>
        </div>
      </div>

      {/* 3-Column Layout Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[760px] pb-6">
        {/* ======================================================== */}
        {/* COLUMN 1 (right in RTL): Chat List                        */}
        {/* ======================================================== */}
        <section className="lg:col-span-4 xl:col-span-3 bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm flex flex-col overflow-hidden h-[780px]">
          <div className="p-4 border-b border-surface-container-high">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-on-surface">صندوق پیام‌ها</h1>
                {totalUnread > 0 && (
                  <span className="bg-m3-primary/10 text-m3-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    {toPersianDigits(totalUnread)} پیام جدید
                  </span>
                )}
              </div>
            </div>
            {/* Search input inside chats */}
            <div className="relative mb-1">
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-m3-outline text-[18px]">search</span>
              <input
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl pr-9 pl-4 py-2 text-xs focus:ring-2 focus:ring-m3-primary focus:outline-none placeholder:text-m3-outline transition-all text-on-surface"
                placeholder="جستجو در نام، کالا، متن چت..."
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
              />
            </div>
          </div>
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-container custom-scroll">
            {filteredList === null && (
              <div className="p-6 text-center text-xs text-on-surface-variant animate-pulse">در حال دریافت گفتگوها…</div>
            )}
            {filteredList !== null && filteredList.length === 0 && (
              <div className="p-6 flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined text-[40px] text-m3-outline">forum</span>
                <p className="text-sm font-bold text-on-surface">گفتگویی وجود ندارد</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  برای شروع مذاکره، از صفحه دسته‌بندی‌ها وسیله‌ای انتخاب کنید و «گفتگو با مالک» را بزنید.
                </p>
                <Link
                  href="/categories"
                  className="bg-m3-primary hover:bg-primary-container text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  مشاهده دسته‌بندی‌ها
                </Link>
              </div>
            )}
            {filteredList?.map((c) => {
              const active = c.id === selectedId;
              const name = c.other?.name ?? "کاربر اورا";
              return (
                <div
                  key={c.id}
                  className={
                    "p-3.5 transition-all cursor-pointer relative group " +
                    (active
                      ? "bg-m3-primary/5 border-r-4 border-m3-primary hover:bg-m3-primary/10"
                      : "hover:bg-surface-container-low")
                  }
                  onClick={() => select(c.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") select(c.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <InitialAvatar name={name} />
                      <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-on-surface truncate">{name}</span>
                        </div>
                        <span className={"text-[11px] font-semibold " + (active ? "text-m3-primary" : "text-m3-outline")}>
                          {c.lastMessage ? faTimeAgo(c.lastMessage.createdAt) : ""}
                        </span>
                      </div>
                      {c.listing && (
                        <p className="text-xs font-semibold text-primary-container truncate mb-1">
                          📷 {c.listing.title}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-on-surface-variant truncate max-w-[170px] leading-relaxed">
                          {c.lastMessage
                            ? (c.lastMessage.senderId === myUserId ? "شما: " : "") + c.lastMessage.body
                            : "هنوز پیامی رد و بدل نشده است"}
                        </p>
                        {c.unread > 0 && (
                          <span className="w-4 h-4 rounded-full bg-m3-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow">
                            {toPersianDigits(c.unread)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* COLUMN 2 (center): Active Conversation Stream              */}
        {/* ======================================================== */}
        <section className="lg:col-span-8 xl:col-span-6 bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm flex flex-col overflow-hidden h-[780px]">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-m3-outline">chat</span>
              <p className="font-bold text-on-surface">یک گفتگو را از فهرست انتخاب کنید</p>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                پیام‌های هر گفتگو هر {toPersianDigits(4)} ثانیه به‌صورت خودکار به‌روزرسانی می‌شوند.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-surface-container-high bg-white/90 backdrop-blur-md flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <InitialAvatar name={selected.other?.name ?? "کاربر"} size="w-11 h-11" />
                    <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base text-on-surface truncate">{selected.other?.name ?? "کاربر اورا"}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {selected.lastMessage ? `آخرین پیام ${faTimeAgo(selected.lastMessage.createdAt)}` : "گفتگوی جدید"}
                      </span>
                      <span>•</span>
                      <span>مذاکره و پیگیری رزرو</span>
                    </div>
                  </div>
                </div>
                {/* Action buttons inside chat header */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary text-xs font-bold transition-all"
                    disabled
                    title="به‌زودی"
                  >
                    <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>
                    <span className="hidden sm:inline">تماس تلفنی امن</span>
                  </button>
                  <button className="p-2 hover:bg-surface-container rounded-xl text-m3-outline hover:text-m3-error transition-colors" disabled title="به‌زودی">
                    <span className="material-symbols-outlined text-[18px]">flag</span>
                  </button>
                  <button className="p-2 hover:bg-surface-container rounded-xl text-m3-outline hover:text-on-surface transition-colors" disabled title="به‌زودی">
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </div>
              </div>
              {/* Rental Item Quick Ribbon underneath header (listing context) */}
              {selected.listing && (
                <Link
                  href={`/item-details/${selected.listing.id}`}
                  className="bg-surface-container-high/60 border-b border-surface-variant px-5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    { }
                    <img
                      className="w-8 h-8 rounded-lg object-cover border border-outline-variant shrink-0"
                      src={selected.listing.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg"}
                      alt={selected.listing.title}
                    />
                    <div className="truncate">
                      <span className="font-bold text-on-surface">{selected.listing.title}</span>
                      <span className="text-on-surface-variant mx-1.5">|</span>
                      <span className="text-m3-primary font-semibold">مشاهده صفحه وسیله و شرایط اجاره</span>
                    </div>
                  </div>
                  <span className="shrink-0 bg-m3-primary/15 text-m3-primary font-bold px-2 py-0.5 rounded text-[11px]">
                    جزئیات رزرو
                  </span>
                </Link>
              )}
              {/* Trust & Safety Banner */}
              <div className="mx-4 my-2.5 px-3.5 py-2 rounded-xl bg-surface-container border border-surface-variant flex items-center gap-2.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-m3-primary text-[20px] shrink-0 fill">verified_user</span>
                <p className="leading-relaxed">
                  <strong className="text-on-surface">ضمانت اورا گارد:</strong> جهت حفظ پوشش بیمه، تمام پرداخت‌ها و
                  مذاکرات باید داخل سامانه انجام شود. از پرداخت کارت‌به‌کارت خودداری کنید.
                </p>
              </div>
              {/* Chat History Scroll View */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 custom-scroll bg-m3-surface/30" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs text-m3-outline">
                    هنوز پیامی در این گفتگو ثبت نشده است — اولین پیام را بفرستید.
                  </div>
                )}
                {messages.map((m) => {
                  const mine = m.senderId === myUserId;
                  const otherName = selected.other?.name ?? "کاربر";
                  return (
                    <div key={m.id} className={"flex items-start gap-2.5 max-w-[85%] " + (mine ? "mr-auto flex-row-reverse" : "")}>
                      {mine ? (
                        <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-sm">
                          {myName?.trim()?.[0] ?? "ش"}
                        </div>
                      ) : (
                        <InitialAvatar name={otherName} size="w-8 h-8" tone="solid" />
                      )}
                      <div className="min-w-0">
                        <div
                          className={
                            "p-3.5 rounded-2xl shadow-sm text-xs leading-relaxed " +
                            (mine
                              ? "bg-m3-primary text-on-primary rounded-tl-none"
                              : "bg-surface-container-high text-on-surface rounded-tr-none")
                          }
                        >
                          {m.body}
                          {m.attachmentUrl && (
                            <span className="block mt-1 text-[10px] opacity-80">📎 پیوست: {m.attachmentUrl}</span>
                          )}
                        </div>
                        <div
                          className={
                            "flex items-center gap-1.5 mt-1 text-[10px] text-m3-outline " +
                            (mine ? "justify-end pl-1" : "pr-1")
                          }
                        >
                          <span>{timeFa(m.createdAt)}</span>
                          {mine && <span className="material-symbols-outlined text-[13px] text-m3-primary fill">done_all</span>}
                          {!mine && <span className="font-medium text-m3-secondary">{otherName}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Chat Bottom Input Bar */}
              <div className="p-3.5 border-t border-surface-container-high bg-white">
                <div className="flex items-end gap-2 bg-surface-container-low rounded-2xl border border-surface-variant p-2 focus-within:ring-2 focus-within:ring-m3-primary focus-within:border-transparent transition-all">
                  {/* Attachment button — disabled until storage integration */}
                  <button
                    className="p-2 rounded-xl text-m3-outline hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
                    disabled
                    title="آپلود فایل پس از اتصال فضای ذخیره‌سازی فعال می‌شود"
                  >
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>
                  {/* Text Input */}
                  <textarea
                    className="flex-1 bg-transparent border-0 focus:ring-0 p-1.5 text-xs text-on-surface placeholder:text-m3-outline resize-none max-h-24 focus:outline-none"
                    placeholder="پیام خود را بنویسید... (ارسال با Enter)"
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  {/* Send button */}
                  <button
                    className="bg-m3-primary hover:bg-primary-container text-white p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm disabled:opacity-60"
                    title="ارسال پیام"
                    onClick={send}
                    disabled={sending || !text.trim()}
                  >
                    <span className="material-symbols-outlined text-[18px] rotate-180">send</span>
                  </button>
                </div>
                {/* Micro bottom caption */}
                <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-m3-outline">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-emerald-600">verified</span>
                    ارسال سریع و رمزگذاری‌شده سرتاسری اورا
                  </span>
                  <span>کلید Enter برای ارسال • Shift+Enter خط جدید</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ======================================================== */}
        {/* COLUMN 3 (left): Rental & Contract Summary                 */}
        {/* ======================================================== */}
        <section className="lg:col-span-12 xl:col-span-3 bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm flex flex-col overflow-hidden h-[780px] max-lg:h-auto">
          <div className="p-4 border-b border-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-primary text-[20px]">contract</span>
              <h2 className="font-bold text-sm text-on-surface">خلاصه رزرو و قرارداد</h2>
            </div>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
              {selected?.reservationId ? "رزرو مرتبط فعال" : "بدون رزرو متصل"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll text-xs">
            {selected?.listing ? (
              <>
                {/* Item Card Thumbnail */}
                <Link href={`/item-details/${selected.listing.id}`} className="block rounded-2xl border border-surface-variant overflow-hidden bg-surface-container-low group">
                  <div className="relative h-36 w-full overflow-hidden bg-surface-container">
                    { }
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={selected.listing.images[0]?.url ?? "/assets/img/45fb8e31c9b9.jpg"}
                      alt={selected.listing.title}
                    />
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                      کد کالا: #{selected.listing.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-on-surface mb-1">{selected.listing.title}</h3>
                    <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-amber-500 fill">star</span>
                      مشاهده مشخصات، قیمت روزانه و نظرات در صفحه وسیله
                    </p>
                  </div>
                </Link>
                {/* Rental Specs */}
                <div className="bg-surface-container-low rounded-2xl p-3.5 border border-surface-variant space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-m3-primary">location_on</span>
                      مذاکره جاری:
                    </span>
                    <span className="font-bold text-on-surface">{selected.other?.name ?? "کاربر اورا"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-m3-primary">local_shipping</span>
                      شیوه تحویل و ودیعه:
                    </span>
                    <span className="font-bold text-emerald-700">طبق توافق در چت</span>
                  </div>
                  <div className="pt-2 border-t border-surface-variant flex items-center justify-between">
                    <span className="text-on-surface-variant">طرفین گفتگو:</span>
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      <span className="text-m3-primary">شما</span>
                      <span>↔</span>
                      <span className="text-on-surface">{selected.other?.name ?? "کاربر"}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant text-center text-on-surface-variant leading-relaxed">
                برای نمایش خلاصه کالا، یک گفتگوی متصل به وسیله را انتخاب کنید.
              </div>
            )}
            {selected?.reservationId ? (
              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-surface-variant space-y-2">
                <div className="text-xs font-bold text-on-surface mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-m3-primary">calculate</span>
                  رزرو متصل به این گفتگو
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  وضعیت پرداخت، ودیعه و تحویل در صفحه چرخه رزرو قابل پیگیری است (مبالغ دفتر درون‌برنامه‌ای و
                  شبیه‌سازی).
                </p>
                <p className="text-on-surface-variant">
                  مبلغ ودیعه: <span className="font-bold text-on-surface">{faToman(0)}</span>{" "}
                  <span className="text-[10px] text-m3-outline">(در چرخه رزرو نمایش داده می‌شود)</span>
                </p>
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-surface-variant text-on-surface-variant leading-relaxed">
                هنوز رزروی به این گفتگو متصل نشده است؛ پس از ثبت درخواست اجاره، وضعیت قرارداد اینجا نمایش داده
                می‌شود.
              </div>
            )}
          </div>
          {/* Action buttons for user */}
          <div className="space-y-2 pt-1 p-4 border-t border-surface-container-high">
            {selected?.reservationId ? (
              <Link
                href={`/rental-lifecycle/${selected.reservationId}`}
                className="w-full bg-m3-primary hover:bg-primary-container text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">credit_card</span>
                <span>پیگیری پرداخت و چرخه رزرو</span>
              </Link>
            ) : (
              <button
                className="w-full bg-m3-primary hover:bg-primary-container text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                disabled
                title="به‌زودی"
              >
                <span className="material-symbols-outlined text-[16px]">credit_card</span>
                <span>پرداخت و نهایی‌سازی رزرو</span>
              </button>
            )}
            {selected?.listing ? (
              <Link
                href={`/item-details/${selected.listing.id}`}
                className="w-full bg-surface-container hover:bg-surface-variant text-on-surface font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span>مشاهده شرایط قرارداد و قوانین کالا</span>
              </Link>
            ) : (
              <button
                className="w-full bg-surface-container hover:bg-surface-variant text-on-surface font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                disabled
                title="به‌زودی"
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span>مشاهده شرایط قرارداد و قوانین کالا</span>
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Error toast */}
      {err && (
        <div className="fixed bottom-6 right-1/2 translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-xl text-label-md font-semibold bg-m3-error text-m3-on-error max-w-[92vw] text-center" role="status">
          {err}
        </div>
      )}
    </>
  );
}
