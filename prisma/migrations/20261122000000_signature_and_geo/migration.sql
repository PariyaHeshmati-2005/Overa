-- Add exact map coordinates for listings (shared map components; optional —
-- legacy rows keep NULL and fall back to the city centroid).
ALTER TABLE "Listing" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN "lng" DOUBLE PRECISION;

-- Digital contract signature of the renter (one-time code verification).
ALTER TABLE "Reservation" ADD COLUMN "signedByRenterAt" TIMESTAMP(3);
