import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { planSchema } from "@/lib/validations/subscription";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireRole(ROLE_GROUPS.ADMIN_ONLY);
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = planSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const plan = await prisma.plan.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ plan });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireRole(ROLE_GROUPS.ADMIN_ONLY);
  if (gate instanceof NextResponse) return gate;

  // Soft-delete: deactivate instead of hard-deleting, since historical
  // subscriptions/vouchers may still reference this plan.
  const plan = await prisma.plan.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ plan });
}
