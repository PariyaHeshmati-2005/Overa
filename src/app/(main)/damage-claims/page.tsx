import SiteHeader from "@/components/layout/SiteHeader";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import UserMenu from "@/components/layout/UserMenu";
import DamageClaimsClient from "./DamageClaimsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "ثبت ادعای خسارت و داوری" };

/**
 * damage-claims.html → /damage-claims (protected)
 * Header faithful to the source fixed header; user chip is session-aware.
 */
export default async function DamageClaimsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/damage-claims"));

  return (
    <>
      {/* Fixed header — faithful to damage-claims.html */}
            <SiteHeader />

      <DamageClaimsClient viewerId={user.id} viewerName={user.name} />
    </>
  );
}