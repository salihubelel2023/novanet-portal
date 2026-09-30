import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { planSchema } from "@/lib/validations/subscription";

export async function GET() {
  const gate = await apiRequireRole(ROLE_GROUPS.ADMIN_ONLY);
  if (gate instanceof NextResponse) return gate;

  const plans = await prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true, vouchers: true } } },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const gate = await apiRequireRole(ROLE_GROUPS.ADMIN_ONLY);
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const plan = await prisma.plan.create({ data: parsed.data });
  return NextResponse.json({ plan }, { status: 201 });
}
