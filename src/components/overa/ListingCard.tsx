import Link from "next/link";
import { faNumber, faToman } from "@/lib/format";

export type ListingCardData = {
  id: string;
  title: string;
  city: string;
  area?: string | null;
  dailyPrice: number;
  rating: number;
  reviewsCount: number;
  instantBook?: boolean;
  discountBadge?: string | null;
  imageUrl: string;
  status?: string;
};

/**
 * Product card — faithful to the source `data-purpose="product-card"` markup
 * (rounded-3xl, purple border, shadow-card, hover zoom, Persian numbers).
 */
export default function ListingCard({
  listing,
}: {
  listing: ListingCardData;
}) {
  return (
    <article className="bg-white rounded-3xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col group overflow-hidden">
      <Link
        href={`/item-details/${listing.id}`}
        className="relative h-44 w-full overflow-hidden bg-neutral-100 block"
        aria-label={listing.title}
      >
        <img
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={listing.imageUrl}
        />
        {listing.discountBadge ? (
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white badge-gradient-special shadow-sm">
            {listing.discountBadge}
          </span>
        ) : null}
        {listing.instantBook ? (
          <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white badge-gradient-hot shadow-sm">
            تحویل فوری
          </span>
        ) : null}
      </Link>
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link href={`/item-details/${listing.id}`}>
            <h3 className="text-sm font-bold text-neutral-text line-clamp-1 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
          </Link>
          <div className="flex items-center justify-between text-xs text-neutral-muted mt-2 font-medium">
            <div className="flex items-center gap-1">
              <span className="text-accent-gold">★</span>
              <span className="font-bold text-neutral-text">
                {faNumber(listing.rating.toFixed(1))}
              </span>
              <span className="text-[11px] text-neutral-muted">
                ({faNumber(listing.reviewsCount)})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-neutral-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="">{listing.area ? `${listing.city}، ${listing.area}` : listing.city}</span>
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-primary">
              {faToman(listing.dailyPrice)}
            </span>
            <span className="text-[10px] text-neutral-muted">تومان / روز</span>
          </div>
          <Link
            href={`/item-details/${listing.id}`}
            aria-label={`مشاهده ${listing.title}`}
            className="w-8 h-8 rounded-full bg-primary-soft text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
