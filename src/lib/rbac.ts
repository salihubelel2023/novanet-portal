import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
  status: string;
};

/** Convenience groupings used throughout the dashboard nav + guards. */
export const ROLE_GROUPS = {
  ADMIN_ONLY: ["ADMIN"] as Role[],
  STAFF: ["ADMIN", "TECHNICIAN"] as Role[],
  CUSTOMERS: ["RESIDENT", "BUSINESS"] as Role[],
  BILLED_CUSTOMERS: ["RESIDENT", "BUSINESS", "HOTSPOT_USER"] as Role[],
  EVERYONE: ["ADMIN", "TECHNICIAN", "RESIDENT", "BUSINESS", "HOTSPOT_USER"] as Role[],
};

/**
 * Server Component / Server Action guard. Redirects to /login when signed
 * out, and to /unauthorized when the role doesn't match. This is the
 * second of three enforcement layers (see middleware.ts for the first) —
 * middleware alone is not treated as sufficient, since edge middleware has
 * historically been bypassable (e.g. header-spoofing CVEs against
 * Next.js), so every protected page re-checks the session itself.
 */
export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.status === "SUSPENDED") redirect("/login?suspended=1");
  if (!allowed.includes(session.user.role)) redirect("/unauthorized");
  return session.user;
}

/** Same as requireRole but allows any authenticated user. */
export async function requireAuth(): Promise<SessionUser> {
  return requireRole(ROLE_GROUPS.EVERYONE);
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * API route guard. Returns the session user, or a ready-to-return
 * NextResponse if the caller should bail out immediately:
 *
 *   const gate = await apiRequireRole(["ADMIN"]);
 *   if (gate instanceof NextResponse) return gate;
 *   const user = gate;
 */
export async function apiRequireRole(
  allowed: Role[]
): Promise<SessionUser | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.user.status === "SUSPENDED") {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  return session.user;
}

export async function apiRequireAuth(): Promise<SessionUser | NextResponse> {
  return apiRequireRole(ROLE_GROUPS.EVERYONE);
}
