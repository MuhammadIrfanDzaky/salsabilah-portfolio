import { NextResponse, type NextRequest } from "next/server";

/**
 * Exposes the requested path to server components as `x-pathname`.
 *
 * The 404 page needs the path to answer in the reader's language, but
 * `not-found.tsx` receives no route params, and reading it on the client means
 * the first paint is always the wrong language until hydration swaps it. This
 * makes the correct language available in the very first byte.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip build output and static files — they never render a 404 page.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|webp|avif|svg|pdf)$).*)",
  ],
};
