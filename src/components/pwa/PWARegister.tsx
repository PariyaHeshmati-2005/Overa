"use client";

import { useEffect } from "react";

/**
 * Registers the Overa service worker so the app is installable (PWA)
 * on Android, iOS and desktop browsers. Renders nothing.
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Service workers require https (or localhost in development).
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation is a progressive enhancement — never block the app.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
