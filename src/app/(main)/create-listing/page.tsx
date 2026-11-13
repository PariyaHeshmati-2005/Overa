import { redirect } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import CreateListingWizard, { type WizardInitial } from "./CreateListingWizard";
import { parseBlockedRanges } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ثبت و اجاره دادن وسیله جدید",
};

export default async function CreateListingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin-otp?next=" + encodeURIComponent("/create-listing"));

  const { edit } = await searchParams;

  const [categories, categoryAvgs, sampleImages] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.listing.groupBy({
      by: ["categoryId"],
      where: { status: "ACTIVE" },
      _avg: { dailyPrice: true },
    }),
    Promise.resolve(
      fs
        .readdirSync(path.join(process.cwd(), "public", "assets", "img"))
        .filter((f) => f.endsWith(".jpg"))
        .sort()
        .map((f) => `/assets/img/${f}`),
    ),
  ]);

  const categoryAvgPrice: Record<string, number> = {};
  for (const g of categoryAvgs) {
    if (g._avg.dailyPrice) {
      categoryAvgPrice[g.categoryId] = Math.round(g._avg.dailyPrice / 10000) * 10000;
    }
  }

  let initial: WizardInitial = null;
  if (edit) {
    const listing = await db.listing.findUnique({
      where: { id: edit },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!listing || listing.ownerId !== user.id) redirect("/my-items");
    // Existing reservations render as locked days on the host availability
    // calendar so the owner cannot block already-rented days.
    const activeReservations = await db.reservation.findMany({
      where: { listingId: listing.id, status: { notIn: ["CANCELLED", "REJECTED"] } },
      select: { startDate: true, endDate: true },
    });
    initial = {
      id: listing.id,
      status: listing.status,
      categoryId: listing.categoryId,
      title: listing.title,
      description: listing.description,
      brand: listing.brand,
      specs: listing.specs,
      dailyPrice: listing.dailyPrice,
      weeklyPrice: listing.weeklyPrice,
      deposit: listing.deposit,
      city: listing.city,
      area: listing.area,
      rules: listing.rules,
      minDays: listing.minDays,
      maxDays: listing.maxDays,
      instantBook: listing.instantBook,
      pickupInPerson: listing.pickupInPerson,
      deliveryCourier: listing.deliveryCourier,
      images: listing.images.map((i) => i.url),
      blockedRanges: parseBlockedRanges(listing.blockedRanges),
      reservedRanges: activeReservations.map((r) => ({
        start: r.startDate.toISOString().slice(0, 10),
        end: r.endDate.toISOString().slice(0, 10),
      })),
    };
  }

  return (
    <CreateListingWizard
      categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))}
      sampleImages={sampleImages}
      initial={initial}
      userName={user.name}
      categoryAvgPrice={categoryAvgPrice}
    />
  );
}
