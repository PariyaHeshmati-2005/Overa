"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Real PWA install plumbing (client-side singleton).
 *
 * - Captures the one-shot `beforeinstallprompt` event as early as possible
 *   (module scope) so any component can later request installation.
 * - Detects already-installed state via `display-mode: standalone` (covers
 *   Android/desktop Chromium and iOS Safari) and the `appinstalled` event.
 * - No fake buttons: `promptInstall()` only exists when the browser actually
 *   supports the install prompt.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let capturedEvent: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export type PwaInstallState = {
  canInstall: boolean;
  isInstalled: boolean;
};

/** Stable snapshot object (useSyncExternalStore compares by reference). */
let snapshot: PwaInstallState = { canInstall: false, isInstalled: false };
const SERVER_SNAPSHOT: PwaInstallState = { canInstall: false, isInstalled: false };

function recompute() {
  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      // iOS Safari exposes navigator.standalone for home-screen web apps.
      (window.navigator as Navigator & { standalone?: boolean })
        .standalone === true);
  const next = { canInstall: capturedEvent !== null, isInstalled: standalone };
  // Only touch the snapshot when something actually changed.
  if (next.canInstall !== snapshot.canInstall || next.isInstalled !== snapshot.isInstalled) {
    snapshot = next;
    listeners.forEach((l) => l());
  }
}

function getSnapshot(): PwaInstallState {
  return snapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Sync once on subscribe — dispatched from an external-system callback,
  // never synchronously inside an effect body.
  Promise.resolve().then(recompute);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar; Overa offers installation through its own UI.
    e.preventDefault();
    capturedEvent = e as BeforeInstallPromptEvent;
    recompute();
  });
  window.addEventListener("appinstalled", () => {
    capturedEvent = null;
    recompute();
  });
}

export function usePwaInstall(): PwaInstallState & {
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
} {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

  const promptInstall = useCallback(async () => {
    if (!capturedEvent) return "unavailable";
    await capturedEvent.prompt();
    const { outcome } = await capturedEvent.userChoice;
    // The event is single-use; clear it after prompting.
    capturedEvent = null;
    recompute();
    return outcome;
  }, []);

  return { ...state, promptInstall };
}
