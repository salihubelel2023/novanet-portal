import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { getStarlinkTelemetry, starlinkIntegrationStatus } from "@/lib/services/starlink";

export async function GET() {
  const gate = await apiRequireRole(ROLE_GROUPS.STAFF);
  if (gate instanceof NextResponse) return gate;

  const dishes = await prisma.networkDevice.findMany({ where: { type: "STARLINK_DISH" } });
  const telemetry = await Promise.all(dishes.map((d) => getStarlinkTelemetry(d.id)));

  return NextResponse.json({ mode: starlinkIntegrationStatus(), telemetry });
}
