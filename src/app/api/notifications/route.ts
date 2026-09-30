import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireAuth } from "@/lib/rbac";

export async function GET(req: Request) {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);

  const notifications = await prisma.notification.findMany({
    where: { userId: gate.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ notifications });
}

/** Mark every notification for the current user as read. */
export async function PATCH() {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  await prisma.notification.updateMany({
    where: { userId: gate.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
