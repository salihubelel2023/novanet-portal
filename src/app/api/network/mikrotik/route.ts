import { NextResponse } from "next/server";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { getMikrotikClient, isMikrotikConfigured } from "@/lib/services/mikrotik";

export async function GET() {
  const gate = await apiRequireRole(ROLE_GROUPS.STAFF);
  if (gate instanceof NextResponse) return gate;

  if (!isMikrotikConfigured()) {
    return NextResponse.json({ configured: false, resource: null, activeUsers: [] });
  }

  const client = getMikrotikClient()!;
  try {
    const [resource, activeUsers] = await Promise.all([
      client.getSystemResource(),
      client.listActiveHotspotUsers(),
    ]);
    return NextResponse.json({ configured: true, resource, activeUsers });
  } catch (err) {
    return NextResponse.json(
      { configured: true, reachable: false, error: (err as Error).message },
      { status: 200 }
    );
  }
}
