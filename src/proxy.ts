// Runs before a route renders. Renamed from middleware.ts, which Next 16
// deprecates in favour of this convention.
//
// This is a cheap early redirect, not the access control. It runs before the
// database is reachable, so it can only see whether an auth_token cookie
// exists — not whether it means anything. requireUser() in lib/identity.ts is
// what actually verifies a session, and every page and action goes through it.
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/auth/login", "/auth/signup"];
const apiRoutes = ["/api"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow API routes and public auth routes
  if (apiRoutes.some(route => pathname.startsWith(route)) || publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images folder (public images)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|images/).*)",
  ],
};
