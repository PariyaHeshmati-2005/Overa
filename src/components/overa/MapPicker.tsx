"use client";

import { useEffect, useRef, useState } from "react";
import { loadLeaflet, type LeafletMap, type LeafletMarker, type LeafletNS } from "./mapLoader";
import { cityCenter, osmLink } from "@/lib/geo";
import { toPersianDigits } from "@/lib/format";

type NominatimHit = { display_name: string; lat: string; lon: string };

/**
 * Interactive location picker for the create-listing wizard (step 1).
 *
 * - Click on the map (or drag the pin) sets the exact pickup location.
 * - Built-in address search (Nominatim / OpenStreetMap) finds streets/cities.
 * - "موقعیت فعلی من" uses the device GPS when the visitor allows it.
 * - Emits {lat, lng} upward; the wizard stores them on the listing so renters
 *   can later see the real neighbourhood on the item-details map.
 */
export default function MapPicker({
  lat,
  lng,
  city,
  area,
  onChange,
  height = 260,
}: {
  lat: number | null;
  lng: number | null;
  city: string;
  area?: string;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const nsRef = useRef<LeafletNS | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NominatimHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  const start = (() => {
    if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
    const c = cityCenter(city);
    return { lat: c.lat, lng: c.lng };
  })();
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        const ns = L as unknown as LeafletNS;
        nsRef.current = ns;
        const s = startRef.current;
        map = ns.map(containerRef.current, {
          center: [s.lat, s.lng],
          zoom: 12,
          scrollWheelZoom: false,
        });
        ns.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        const icon = ns.divIcon({
          className: "",
          html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#7c3aed;color:#fff;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(124,58,237,.45)"><span style="transform:rotate(45deg);font-size:14px">📍</span></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });
        markerRef.current = ns
          .marker([s.lat, s.lng], { icon, draggable: true })
          .addTo(map);
        markerRef.current.on("dragend", (e) => {
          onChange(Math.round(e.latlng.lat * 1e6) / 1e6, Math.round(e.latlng.lng * 1e6) / 1e6);
        });
        map.on("click", (e) => {
          const { lat: la, lng: ln } = e.latlng;
          markerRef.current?.setLatLng([la, ln]);
          onChange(Math.round(la * 1e6) / 1e6, Math.round(ln * 1e6) / 1e6);
        });
        mapRef.current = map;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The map is created once; external state changes flow through handlers.
  }, []);

  /** Keep the pin in sync when the city select or a reset changes lat/lng. */
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      markerRef.current?.setLatLng([lat, lng]);
      mapRef.current?.setView([lat, lng], 13);
    }
  }, [lat, lng]);

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setHits([]);
    try {
      const res = await fetch(
        `/api/geo/search?q=${encodeURIComponent(q)}&lat=${startRef.current.lat}&lon=${startRef.current.lng}`,
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.results)) {
        setHits(data.results.slice(0, 5) as NominatimHit[]);
        if (!data.results.length) setGeoMsg("نتیجه‌ای برای این جستجو پیدا نشد.");
      } else {
        setGeoMsg(data.error ?? "جستجوی آدرس در دسترس نیست؛ روی نقشه انتخاب کنید.");
      }
    } catch {
      setGeoMsg("جستجوی آدرس در دسترس نیست؛ روی نقشه انتخاب کنید.");
    } finally {
      setSearching(false);
    }
  }

  function applyHit(hit: NominatimHit) {
    const la = Math.round(Number(hit.lat) * 1e6) / 1e6;
    const ln = Math.round(Number(hit.lon) * 1e6) / 1e6;
    markerRef.current?.setLatLng([la, ln]);
    mapRef.current?.setView([la, ln], 15);
    onChange(la, ln);
    setHits([]);
    setQuery("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoMsg("مرورگر شما موقعیت‌یابی را پشتیبانی نمی‌کند.");
      return;
    }
    setBusy(true);
    setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const la = Math.round(p.coords.latitude * 1e6) / 1e6;
        const ln = Math.round(p.coords.longitude * 1e6) / 1e6;
        markerRef.current?.setLatLng([la, ln]);
        mapRef.current?.setView([la, ln], 15);
        onChange(la, ln);
        setBusy(false);
      },
      () => {
        setBusy(false);
        setGeoMsg("دسترسی به موقعیت داده نشد؛ محل را روی نقشه انتخاب کنید.");
      },
      { timeout: 8000 },
    );
  }

  if (failed) {
    return (
      <div
        className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 flex flex-col gap-2"
        style={{ minHeight: height }}
      >
        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#7c3aed]">location_off</span>
          بارگذاری نقشه ممکن نشد (اتصال اینترنت را بررسی کنید)
        </p>
        <div className="flex flex-col gap-1 text-[11px] text-slate-500" dir="ltr">
          <span>Lat: {toPersianDigits((typeof lat === "number" ? lat : start.lat).toFixed(5))}</span>
          <span>Lng: {toPersianDigits((typeof lng === "number" ? lng : start.lng).toFixed(5))}</span>
        </div>
        <a
          href={osmLink(typeof lat === "number" ? lat : start.lat, typeof lng === "number" ? lng : start.lng, 15)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 rounded-lg bg-[#7c3aed] px-3 py-1.5 text-[11px] font-bold text-white"
        >
          انتخاب محل در OpenStreetMap
          <span className="material-symbols-outlined text-sm">north_east</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="جستجوی شهر، محله یا آدرس (مثلاً تهران، سعادت‌آباد)"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-9 pl-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#ddd6fe]"
          />
        </div>
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={searching || !query.trim()}
          className="rounded-lg bg-[#7c3aed] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-50"
        >
          {searching ? "…" : "جستجو"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          title="موقعیت فعلی من"
          className="inline-flex items-center gap-1 rounded-lg border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-2 text-xs font-bold text-[#6d28d9] transition-colors hover:bg-[#ede9fe] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">my_location</span>
          موقعیت من
        </button>
      </div>

      {/* Search results */}
      {hits.length > 0 && (
        <ul className="overflow-hidden rounded-lg border border-slate-200 bg-white text-xs">
          {hits.map((h, i) => (
            <li key={`${h.lat}-${h.lon}-${i}`}>
              <button
                type="button"
                onClick={() => applyHit(h)}
                className="block w-full px-3 py-2 text-right font-medium text-slate-600 transition-colors hover:bg-[#f5f3ff] hover:text-[#6d28d9]"
              >
                <span className="material-symbols-outlined mr-1 inline-block align-[-3px] text-sm text-[#7c3aed]">
                  place
                </span>
                {h.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {geoMsg && <p className="text-[11px] font-semibold text-amber-600">{geoMsg}</p>}

      {/* Map canvas — `isolate z-0` keeps Leaflet's internal panes
             (z-index 400–1000) inside this box so the map can never overlay
             the site's sticky header (z-50) while the page scrolls. */}
      <div
        className="relative isolate z-0 overflow-hidden rounded-xl border border-slate-200/70"
        style={{ height }}
      >
        <div ref={containerRef} className="h-full w-full bg-slate-100" />
        <div className="pointer-events-none absolute bottom-2 right-2 z-[500] rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow">
          {typeof lat === "number" && typeof lng === "number" ? (
            <span dir="ltr">
              {toPersianDigits(lat.toFixed(5))} ، {toPersianDigits(lng.toFixed(5))}
            </span>
          ) : (
            <span>محل دقیق را روی نقشه انتخاب کنید</span>
          )}
        </div>
        <p className="pointer-events-none absolute left-2 top-2 z-[500] rounded-lg bg-[#7c3aed]/95 px-2.5 py-1 text-[11px] font-bold text-white shadow">
          با یک کلیک روی نقشه، پین را جابه‌جا کنید
        </p>
      </div>
      {area ? (
        <p className="text-[11px] text-slate-500 font-medium">
          موقعیت انتخابی در «{city}» ثبت می‌شود{area ? ` — محله: ${area}` : ""}؛
          آدرس دقیق فقط پس از قطعی شدن رزرو به مستاجر نمایش داده می‌شود.
        </p>
      ) : null}
    </div>
  );
}
