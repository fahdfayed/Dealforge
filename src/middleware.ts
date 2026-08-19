import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/auth/login", "/auth/signup"];
const apiRoutes = ["/api"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow API routes and public routes
  if (apiRoutes.some(route => pathname.startsWith(route)) || publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
