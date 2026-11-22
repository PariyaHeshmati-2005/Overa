import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ItemDetailsApp, {
  type ItemDetailData,
  type OwnerListingData,
  type ReviewData,
} from "./ItemDetailsApp";
import { parseBlockedRanges } from "@/lib/jalali";
import { faToman } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Visibility check runs in the metadata phase so guests hitting an invalid
 * (or non-public) id receive a REAL HTTP 404 — with streaming, checks made
 * in the body phase would flush a 200 shell first.
 */
async function assertViewable(id: string) {
  const viewer = await getCurrentUser();
  const listing = await db.listing.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      ownerId: true,
      title: true,
      description: true,
      dailyPrice: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  if (!listing) notFound();
  const isOwner = viewer?.id === listing.ownerId;
  if (listing.status !== "ACTIVE" && !isOwner && !viewer?.isAdmin) notFound();
  return listing;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await assertViewable(id);
  const ogImage = listing.images[0]?.url;
  return {
    title: listing.title,
    description:
      listing.description.slice(0, 150) +
      ` — اجاره روزانه ${faToman(listing.dailyPrice)} تومان در اٌوِرا`,
    openGraph: {
      title: `${listing.title} | اٌوِرا`,
      description: listing.description.slice(0, 200),
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ItemDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Real 404 for invalid/non-visible ids (already enforced pre-stream in
  // generateMetadata — re-fetched here with full relations for the body).
  await assertViewable(id);

  const viewer = await getCurrentUser();

  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { id: true, slug: true, name: true } },
      owner: {
        select: { id: true, name: true, isHost: true, avatarUrl: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!listing) notFound();

  const ownerItems = await db.listing.findMany({
    where: {
      ownerId: listing.ownerId,
      status: "ACTIVE",
      id: { not: listing.id },
    },
    orderBy: { createdAt: "desc" },
    take: 2,
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  const data: ItemDetailData = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    brand: listing.brand,
    specs: listing.specs,
    rules: listing.rules,
    dailyPrice: listing.dailyPrice,
    weeklyPrice: listing.weeklyPrice,
    deposit: listing.deposit,
    city: listing.city,
    area: listing.area,
    pickupInPerson: listing.pickupInPerson,
    deliveryCourier: listing.deliveryCourier,
    minDays: listing.minDays,
    maxDays: listing.maxDays,
    instantBook: listing.instantBook,
    status: listing.status,
    rating: listing.rating,
    reviewsCount: listing.reviewsCount,
    createdAt: listing.createdAt.toISOString(),
    category: { slug: listing.category.slug, name: listing.category.name },
    owner: {
      id: listing.owner.id,
      name: listing.owner.name,
      isHost: listing.owner.isHost,
    },
    images: listing.images.map((img) => ({ url: img.url, alt: img.alt })),
  };

  const reviews: ReviewData[] = listing.reviews.map((r) => ({
    id: r.id,
    authorName: r.author.name,
    rating: r.rating,
    comment: r.comment,
    hostReply: r.hostReply,
    createdAt: r.createdAt.toISOString(),
  }));

  const otherItems: OwnerListingData[] = ownerItems.map((o) => ({
    id: o.id,
    title: o.title,
    dailyPrice: o.dailyPrice,
    imageUrl: o.images[0]?.url ?? "/assets/img/4bb41475c0e3.jpg",
  }));

  // Non-cancelled reservations of this listing → booked days for the Jalali
  // availability calendar (ISO calendar dates, inclusive on both ends).
  const activeReservations = await db.reservation.findMany({
    where: { listingId: id, status: { notIn: ["CANCELLED", "REJECTED"] } },
    select: { startDate: true, endDate: true },
  });
  const bookedRanges = activeReservations.map((r) => ({
    start: r.startDate.toISOString().slice(0, 10),
    end: r.endDate.toISOString().slice(0, 10),
  }));

  // Days the owner blocked from the create-listing wizard (Jalali calendar).
  const ownerBlockedRanges = parseBlockedRanges(listing.blockedRanges);

  // Whether the signed-in viewer already saved this listing — drives the
  // heart button's initial state (Favorite table, unique per user+listing).
  const favorite = viewer
    ? await db.favorite.findUnique({
        where: {
          userId_listingId: { userId: viewer.id, listingId: listing.id },
        },
        select: { id: true },
      })
    : null;

  return (
    <>
      {/* Page-local styles ported from the source page */}
      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <SiteHeader />
      <ItemDetailsApp
        data={data}
        reviews={reviews}
        otherItems={otherItems}
        viewerId={viewer?.id ?? null}
        bookedRanges={bookedRanges}
        ownerBlockedRanges={ownerBlockedRanges}
        initialFaved={Boolean(favorite)}
      />
      <SiteFooter />
    </>
  );
}
