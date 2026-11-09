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

export const dynamic = "force-dynamic";

export default async function ItemDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { id: true, slug: true, name: true } },
      owner: { select: { id: true, name: true, isHost: true, avatarUrl: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!listing) notFound();

  const viewer = await getCurrentUser();
  const isOwner = viewer?.id === listing.ownerId;
  // 404 for guests/non-owners when the listing is not publicly visible.
  if (listing.status !== "ACTIVE" && !isOwner) notFound();

  const ownerItems = await db.listing.findMany({
    where: { ownerId: listing.ownerId, status: "ACTIVE", id: { not: listing.id } },
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
      />
      <SiteFooter />
    </>
  );
}
