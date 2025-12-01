import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has session token
  const token = request.cookies.get("authjs.session-token") || request.cookies.get("__Secure-authjs.session-token");
  const isAuthenticated = !!token;

  // Public routes that don't require authentication
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApiAuth = pathname.startsWith("/api/auth");

  // Allow access to auth pages and auth API
  if (isAuthPage || isApiAuth) {
    // If authenticated and trying to access login/signup, redirect to home
    if (isAuthenticated && isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
