import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "اورا (Overa) | پلتفرم هوشمند اجاره آنلاین وسایل",
    template: "%s | اورا (Overa)",
  },
  description:
    "اورا؛ بزرگ‌ترین بستر تبادل و اجاره هوشمند وسایل در ایران — اجاره کن به‌جای خرید.",
  icons: {
    icon: "/assets/img/overa_logo_transparent.png",
    shortcut: "/assets/img/overa_logo_transparent.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* Static font stylesheet from /public with relative font URLs —
            must be linked, not imported (processed relative font paths). */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/fonts/fonts.css" />
      </head>
      <body className="min-h-screen antialiased selection:bg-primary-soft selection:text-primary">
        {children}
      </body>
    </html>
  );
}
