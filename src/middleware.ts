import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { Role } from "@prisma/client";

// Middleware builds its own auth from the edge-safe config. It must never
// import "@/auth", because that pulls in prisma and pg, which break on the Edge.
const { auth } = NextAuth(authConfig);

// Paths under /dashboard that are further restricted beyond "any signed-in
// user". Kept in sync with the nav config in components/layout/nav-config.
const ADMIN_ONLY_PREFIXES = ["/dashboard/users", "/dashboard/plans", "/dashboard/analytics"];
const STAFF_ONLY_PREFIXES = ["/dashboard/jobs", "/dashboard/network"];

/**
 * NOTE ON DEFENSE IN DEPTH:
 * This middleware is intentionally NOT the only place access control is
 * enforced. Every dashboard page also calls requireRole() server-side
 * (see src/lib/rbac.ts), and every API route calls apiRequireRole().
 * Relying on middleware alone has been a real source of Next.js auth
 * bypass vulnerabilities in the past, so treat this as a fast, coarse
 * first pass — not the source of truth.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.role as Role;

  if (ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (
    STAFF_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) &&
    role !== "ADMIN" &&
    role !== "TECHNICIAN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
