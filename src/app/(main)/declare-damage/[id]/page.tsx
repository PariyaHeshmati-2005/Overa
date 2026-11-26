import SiteHeader from "@/components/layout/SiteHeader";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import DeclareDamageClient from "./DeclareDamageClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "اعلام خسارت | اٌوِرا" };

type Props = { params: Promise<{ id: string }> };

/**
 * /declare-damage/[id] — the dedicated damage-declaration page. The host's
 * «اعلام خسارت» button (and the renter's, from /damage-claims) lands here to
 * WRITE THE DAMAGE DESCRIPTION before anything is filed; submitting creates
 * the DamageClaim record and moves the order to DISPUTED — EXCEPT the renter's
 * delivery-stage declaration («اعلام خسارت و تحویل کالا»): there the claim is
 * recorded with stage DELIVERY and the order stays in DELIVERED so the renter
 * can still receive the item through the OTP flow.
 */
export default async function DeclareDamagePage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    redirect("/signin-otp?next=" + encodeURIComponent(`/declare-damage/${id}`));

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true, images: { take: 1 } } },
      renter: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
    },
  });
  if (!reservation) notFound();
  const isParticipant =
    reservation.renterId === user.id || reservation.hostId === user.id;
  if (!isParticipant && !user.isAdmin) notFound();

  const againstId =
    reservation.renterId === user.id ? reservation.hostId : reservation.renterId;

  return (
    <>
      <SiteHeader />
      <DeclareDamageClient
        reservationId={reservation.id}
        code={reservation.code}
        listingTitle={reservation.listing.title}
        listingImage={reservation.listing.images[0]?.url ?? null}
        againstName={
          againstId === reservation.renterId
            ? reservation.renter.name
            : reservation.host.name
        }
        viewerIsHost={reservation.hostId === user.id}
        deposit={reservation.deposit}
        // The renter's delivery-issue note (تحویل با وجود مشکلات) — the host
        // must see it BEFORE writing the damage description so the arbitration
        // file is complete.
        renterDeliveryNote={reservation.deliveryNote}
        renterDeliveryStatus={reservation.deliveryStatus}
        renterName={reservation.renter.name}
        // Renter + hand-over stage: after submitting, the tenant can STILL
        // receive the item (the delivery flow is not interrupted).
        deliveryStage={
          reservation.renterId === user.id &&
          reservation.status === "DELIVERED"
        }
      />
    </>
  );
}
