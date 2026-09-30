import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { updateSubscriptionSchema } from "@/lib/validations/subscription";
import { notifyUser } from "@/lib/services/notification";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireRole(ROLE_GROUPS.CUSTOMERS);
  if (gate instanceof NextResponse) return gate;

  const subscription = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  if (!subscription || subscription.userId !== gate.id) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSubscriptionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (parsed.data.action === "CANCEL") {
    await prisma.subscription.update({ where: { id }, data: { status: "CANCELLED", autoRenew: false } });
    await notifyUser({
      userId: gate.id,
      title: "Subscription cancelled",
      message: `Your ${subscription.plan.name} subscription has been cancelled.`,
      type: "SUBSCRIPTION",
    });
  }

  if (parsed.data.action === "TOGGLE_AUTO_RENEW") {
    await prisma.subscription.update({ where: { id }, data: { autoRenew: !subscription.autoRenew } });
  }

  if (parsed.data.action === "RENEW") {
    await prisma.subscription.update({ where: { id }, data: { autoRenew: true, status: "PENDING" } });
  }

  const updated = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  return NextResponse.json({ subscription: updated });
}
