"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { faDateTime } from "@/lib/format";

type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  sender: { id: string; name: string };
  createdAt: string;
};

/**
 * Text-only chat between the two parties of a damage claim (خسارت و ودیعه).
 *
 * - The conversation is the claim's reservation conversation (shared with the
 *   rental-lifecycle chat) — created/reused via POST /api/conversations.
 * - TEXT ONLY by design: no image, voice or file controls at all, and the
 *   server rejects attachments on claim conversations.
 * - Polls every 4s (project convention — no socket.io).
 */
export default function ClaimChat({
  reservationId,
  viewerId,
  viewerName,
  otherName,
}: {
  reservationId: string;
  viewerId: string | null;
  viewerName: string;
  otherName: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Open (or reuse) the reservation conversation. */
  const openConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "شروع گفتگو ممکن نشد.");
        return null;
      }
      return data.conversationId as string;
    } catch {
      toast.error("خطای شبکه در باز کردن گفتگو.");
      return null;
    }
  }, [reservationId]);

  const loadMessages = useCallback(async (cid: string) => {
    try {
      const res = await fetch(`/api/conversations/${cid}/messages`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMessages((data.messages ?? []) as ChatMessage[]);
    } catch {
      /* transient polling error — next tick retries */
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const cid = await openConversation();
      if (!active || !cid) {
        setLoading(false);
        return;
      }
      setConversationId(cid);
      await loadMessages(cid);
      if (active) setLoading(false);
      pollRef.current = setInterval(() => void loadMessages(cid), 4000);
    })();
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [openConversation, loadMessages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body || !conversationId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "ارسال پیام ممکن نشد.");
        return;
      }
      setText("");
      await loadMessages(conversationId);
    } catch {
      toast.error("خطای شبکه در ارسال پیام.");
    } finally {
      setSending(false);
    }
  }

  if (!viewerId) {
    return (
      <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant font-semibold">
        برای مشاهده و ارسال پیام باید وارد حساب خود شوید.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={listRef}
        className="h-56 overflow-y-auto rounded-xl bg-surface-container-low p-3 space-y-2.5"
        dir="rtl"
      >
        {loading ? (
          <p className="text-xs text-on-surface-variant text-center py-8">
            در حال بارگذاری گفتگو…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-8">
            هنوز پیامی رد و بدل نشده است؛ گفتگو را برای هماهنگی درباره این
            پرونده شروع کنید.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === viewerId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    mine
                      ? "bg-m3-primary text-on-primary rounded-tr-sm"
                      : "bg-surface-container-highest text-on-surface rounded-tl-sm"
                  }`}
                >
                  <span
                    className={`block text-[10px] font-bold mb-1 ${
                      mine ? "text-primary-fixed" : "text-m3-secondary"
                    }`}
                  >
                    {mine ? viewerName : (m.sender?.name ?? otherName)} —{" "}
                    {faDateTime(m.createdAt)}
                  </span>
                  <span className="whitespace-pre-line break-words">
                    {m.body}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Text-only composer — no attachments by design (server enforces too) */}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="پیام متنی برای طرف مقابل بنویسید… (Enter ارسال می‌کند)"
          className="flex-1 resize-none rounded-xl bg-surface-container-lowest border border-outline-variant/60 p-3 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary/30"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !text.trim()}
          className="h-11 shrink-0 rounded-xl bg-m3-primary px-4 text-xs font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">send</span>
          {sending ? "…" : "ارسال"}
        </button>
      </div>
      <p className="text-[10px] text-m3-outline">
        گفتگوی پرونده فقط متنی است — ارسال تصویر، ویس یا فایل در این بخش مجاز
        نیست.
      </p>
    </div>
  );
}
