import SiteHeader from "@/components/layout/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
import M3Styles from "@/components/overa/M3Styles";
import LiveChatClient from "./LiveChatClient";

export const metadata: Metadata = { title: "گفتگو و صندوق پیام‌ها" };
export const dynamic = "force-dynamic";

export default async function LiveChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/live-chat"));

  return (
    <div className="bg-m3-background text-on-surface antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <M3Styles />
      {/* ==================== TopNavBar — preserved from live-chat.html ==================== */}
            <SiteHeader />

      {/* ==================== MAIN WORKSPACE CONTAINER ==================== */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 flex flex-col">
        <Suspense fallback={<div className="p-10 text-center text-sm text-on-surface-variant">در حال بارگذاری گفتگوها…</div>}>
          <LiveChatClient myUserId={user.id} myName={user.name} />
        </Suspense>
      </main>
    </div>
  );
}