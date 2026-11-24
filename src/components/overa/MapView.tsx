"use client";

import { useEffect, useRef, useState } from "react";
import { loadLeaflet, type LeafletMap, type LeafletMarker, type LeafletNS } from "./mapLoader";
import { listingCoords, osmLink } from "@/lib/geo";
import { toPersianDigits } from "@/lib/format";

/**
 * Shared read-only location map (item-details, rental-lifecycle delivery
 * card…). Shows the listing pin on OpenStreetMap tiles; when the listing has
 * no exact coordinates the city centroid is rendered with a clearly-worded
 * "approximate" note. Falls back to a coordinate card + external OSM link if
 * the map library cannot load (offline / CDN blocked).
 */
export default function MapView({
  lat,
  lng,
  city,
  area,
  title,
  className = "",
  height = 176,
  zoom,
}: {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  area?: string | null;
  title?: string | null;
  className?: string;
  height?: number;
  zoom?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [failed, setFailed] = useState(false);

  const pos = listingCoords(lat, lng, city);
  const effectiveZoom = zoom ?? (pos.exact ? 15 : 12);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        const ns = L as unknown as LeafletNS;
        map = ns.map(containerRef.current, {
          center: [pos.lat, pos.lng],
          zoom: effectiveZoom,
          scrollWheelZoom: false,
        });
        ns.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        const icon = ns.divIcon({
          className: "",
          html: `<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:#7c3aed;color:#fff;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(124,58,237,.45)"><span style="transform:rotate(45deg);font-size:16px">📍</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });
        markerRef.current = ns
          .marker([pos.lat, pos.lng], { icon, draggable: false })
          .addTo(map);
        mapRef.current = map;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // Position changes are static per mount; re-mount via key when needed.
  }, [pos.lat, pos.lng, effectiveZoom]);

  if (failed) {
    return (
      <div
        className={`rounded-xl border border-slate-200/70 bg-slate-50 p-3 flex flex-col gap-2 ${className}`}
        style={{ minHeight: height }}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="material-symbols-outlined text-[#7c3aed]">location_on</span>
          {city}
          {area ? `، ${area}` : ""}
        </div>
        <p className="text-[11px] text-slate-500 font-medium" dir="ltr">
          {toPersianDigits(pos.lat.toFixed(5))} ، {toPersianDigits(pos.lng.toFixed(5))}
        </p>
        <a
          href={osmLink(pos.lat, pos.lng, effectiveZoom)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 rounded-lg bg-[#7c3aed] px-3 py-1.5 text-[11px] font-bold text-white"
        >
          مشاهده روی نقشه (OpenStreetMap)
          <span className="material-symbols-outlined text-sm">north_east</span>
        </a>
      </div>
    );
  }

  return (
    <div
      /* `isolate z-0` boxes the map in its own stacking context: Leaflet's
         internal panes use z-index 400–1000, which would otherwise float over
         the site's sticky header (z-50) while scrolling. Contained here, they
         can never leave the map box. */
      className={`relative isolate z-0 overflow-hidden rounded-xl border border-slate-200/70 ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full bg-slate-100" />
      <div className="pointer-events-none absolute right-2 top-2 z-[500] max-w-[85%] rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow">
        <span className="material-symbols-outlined inline-block align-[-3px] text-sm text-[#7c3aed]">
          location_on
        </span>
        {title ? `${title} — ` : ""}
        {city}
        {area ? `، ${area}` : ""}
        {!pos.exact && (
          <span className="mr-1 font-medium text-amber-600">(موقعیت تقریبی شهر)</span>
        )}
      </div>
      <a
        href={osmLink(pos.lat, pos.lng, effectiveZoom)}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 left-2 z-[500] rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#6d28d9] shadow hover:bg-white"
      >
        نمای بزرگ‌تر
        <span className="material-symbols-outlined inline-block align-[-3px] text-sm">
          north_east
        </span>
      </a>
    </div>
  );
}
