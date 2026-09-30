import { NextResponse } from "next/server";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { getMikrotikClient } from "@/lib/services/mikrotik";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireRole(ROLE_GROUPS.STAFF);
  if (gate instanceof NextResponse) return gate;

  const client = getMikrotikClient();
  if (!client) return NextResponse.json({ error: "MikroTik is not configured" }, { status: 503 });

  try {
    await client.disconnectActiveUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
