import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Overa proxy (Next 16 successor of middleware — Node.js runtime).
 *
 * Provides REAL HTTP semantics before the streaming shell is flushed
 * (page-level notFound()/redirect() stream a 200 shell once rendering has
 * started, so they can no longer change the status code):
 *
 *  1. /item-details/:id → unknown or non-public listing returns a genuine
 *     HTTP 404 (rendering the branded /404 page body). Owner/admin previews
 *     still work because the page re-checks with the live session.
 *  2. /discounts and /admin-dashboard → guests get a genuine redirect (307)
 *     to the sign-in page with a `next` parameter. Signed-in users pass
 *     through; the pages re-validate server-side as defense in depth.
 */

const ITEM_RE = /^\/item-details\/([^/?#]+)/;
const GATED_ROUTES: Record<string, string> = {
  "/discounts": "/signin-otp?next=%2Fdiscounts",
  "/admin-dashboard": "/signin-otp?next=%2Fadmin-dashboard",
};

/** Validate the session cookie against the DB (read-only, no writes). */
async function sessionUserId(token: string | undefined): Promise<{ id: string; isAdmin: boolean } | null> {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true, user: { select: { id: true, isAdmin: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---------- real 404 for unknown / non-public listings ----------
  const item = ITEM_RE.exec(pathname);
  if (item) {
    const id = item[1];
    const listing = await db.listing.findUnique({
      where: { id },
      select: { id: true, status: true, ownerId: true },
    });
    if (!listing) {
      const rewritten = NextResponse.rewrite(new URL("/404", req.url));
      return new NextResponse(rewritten.body, {
        status: 404,
        statusText: "Not Found",
        headers: rewritten.headers,
      });
    }
    if (listing.status !== "ACTIVE") {
      const user = await sessionUserId(req.cookies.get("overa_session")?.value);
      const privileged = !!user && (user.id === listing.ownerId || user.isAdmin);
      if (!privileged) {
        const rewritten = NextResponse.rewrite(new URL("/404", req.url));
        return new NextResponse(rewritten.body, {
          status: 404,
          statusText: "Not Found",
          headers: rewritten.headers,
        });
      }
    }
    return NextResponse.next();
  }

  // ---------- genuine redirect for guest-only areas ----------
  if (pathname in GATED_ROUTES) {
    const user = await sessionUserId(req.cookies.get("overa_session")?.value);
    if (!user) {
      return NextResponse.redirect(
        new URL(`/signin-otp?next=${encodeURIComponent(pathname)}`, req.url),
        307
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/item-details/:path*", "/discounts", "/admin-dashboard"],
};
