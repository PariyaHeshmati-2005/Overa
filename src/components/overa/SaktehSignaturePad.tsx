"use client";

import { useRef, useState } from "react";

/**
 * «سفته الکترونیک» signature pad — a plain white canvas the renter signs with
 * mouse or touch (pointer events cover both). The signature is captured as a
 * PNG data-URL and handed to the parent; the server rejects a PROMISSORY
 * payment whose signature is missing, so the flow cannot be skipped.
 */
export type SaktehSignaturePadProps = {
  /** Called with the PNG data-URL when the renter confirms their signature. */
  onConfirmed: (dataUrl: string) => void;
  /** True after a signature has been confirmed (shows the confirmation row). */
  signed: boolean;
};

export default function SaktehSignaturePad({
  onConfirmed,
  signed,
}: SaktehSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  function relativePos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (signed) return;
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = relativePos(e);
    lastPos.current = { x, y };
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f1b2e";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasInk(true);
  }

  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || signed) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = relativePos(e);
    const last = lastPos.current ?? { x, y };
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPos.current = { x, y };
  }

  function endDraw() {
    drawing.current = false;
    lastPos.current = null;
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  }

  function confirm() {
    if (!hasInk) return;
    onConfirmed(canvasRef.current!.toDataURL("image/png"));
  }

  return (
    <div className="space-y-3">
      {/* Fixed internal resolution scaled by CSS → crisp uniform strokes. */}
      <div className="rounded-2xl border-2 border-dashed border-m3-primary/40 bg-white p-2">
        <canvas
          ref={canvasRef}
          width={1200}
          height={420}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
          className="block w-full rounded-xl bg-white touch-none cursor-crosshair"
          style={{ height: 200 }}
          aria-label="کادر امضای سفته الکترونیک"
        />
        <p className="text-center text-[10px] text-slate-400 pb-1 pt-1.5 border-t border-slate-100 mt-2">
          امضای خود را در کادر سفید بالا با موس یا انگشت بنویسید
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={signed}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm align-middle">
            eraser
          </span>{" "}
          پاک کردن امضا
        </button>
        {signed ? (
          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <span className="material-symbols-outlined text-base">
              check_circle
            </span>
            امضای سفته ثبت شد
          </span>
        ) : (
          <button
            type="button"
            onClick={confirm}
            disabled={!hasInk}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              hasInk
                ? "bg-m3-primary hover:bg-primary-container text-white shadow-md shadow-m3-primary/25"
                : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
            }`}
          >
            <span className="material-symbols-outlined text-sm align-middle">
              draw
            </span>{" "}
            تایید امضا و ادامه به پرداخت
          </button>
        )}
      </div>
    </div>
  );
}
