"use client";

/**
 * Tiny loader for Leaflet 1.9.4 (CSS + JS) from the public CDN.
 *
 * Maps are rendered client-side only; Leaflet is loaded once on demand and
 * cached in a module-level promise. If the CDN is unreachable the promise
 * rejects and the map components render their graceful fallback card
 * (coordinates + external OSM link), so no page ever breaks.
 */

const LEAFLET_VERSION = "1.9.4";
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

declare global {
  interface Window {
    L?: unknown; // typed loosely; consumers cast to the Leaflet namespace
  }
}

let cssInjected = false;
let scriptPromise: Promise<Record<string, unknown>> | null = null;

function injectCss() {
  if (cssInjected || typeof document === "undefined") return;
  if (document.querySelector('link[data-leaflet="1"]')) {
    cssInjected = true;
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_URL;
  link.setAttribute("data-leaflet", "1");
  document.head.appendChild(link);
  cssInjected = true;
}

/** Resolve the Leaflet namespace (window.L), loading it from CDN once. */
export function loadLeaflet(): Promise<Record<string, unknown>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR"));
  }
  injectCss();
  const existing = window.L as Record<string, unknown> | undefined;
  if (existing) return Promise.resolve(existing);
  if (!scriptPromise) {
    scriptPromise = new Promise<Record<string, unknown>>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = JS_URL;
      s.async = true;
      s.onload = () => {
        const L = window.L as Record<string, unknown> | undefined;
        if (L) resolve(L);
        else reject(new Error("leaflet-missing"));
      };
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("leaflet-cdn-unreachable"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/** Minimal structural typing for the pieces of Leaflet we use. */
export type LeafletMap = {
  setView: (center: [number, number], zoom?: number) => LeafletMap;
  remove: () => void;
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => LeafletMap;
  invalidateSize: () => LeafletMap;
};

export type LeafletMarker = {
  setLatLng: (latlng: [number, number]) => LeafletMarker;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => LeafletMarker;
};

export type LeafletNS = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (
    url: string,
    opts?: Record<string, unknown>
  ) => { addTo: (map: LeafletMap) => unknown };
  marker: (latlng: [number, number], opts?: Record<string, unknown>) => LeafletMarker & {
    addTo: (map: LeafletMap) => LeafletMarker;
  };
  circle: (
    latlng: [number, number],
    opts?: Record<string, unknown>
  ) => { addTo: (map: LeafletMap) => unknown };
  divIcon: (opts: Record<string, unknown>) => unknown;
  DomUtil: {
    create: (tag: string, className?: string, container?: HTMLElement) => HTMLElement;
  };
};
