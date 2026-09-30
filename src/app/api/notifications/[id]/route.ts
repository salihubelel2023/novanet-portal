import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireAuth } from "@/lib/rbac";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== gate.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
