import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { createSubscriptionSchema } from "@/lib/validations/subscription";
import { paystackInitializeTransaction } from "@/lib/services/paystack";
import { flutterwaveInitializePayment } from "@/lib/services/flutterwave";
import { generateReference } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";

export async function GET() {
  const gate = await apiRequireRole(ROLE_GROUPS.CUSTOMERS);
  if (gate instanceof NextResponse) return gate;

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: gate.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ subscriptions });
}

export async function POST(req: Request) {
  const gate = await apiRequireRole(ROLE_GROUPS.CUSTOMERS);
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = createSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "This plan is not available" }, { status: 404 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: gate.id } });

  const subscription = await prisma.subscription.create({
    data: { userId: gate.id, planId: plan.id, status: "PENDING", autoRenew: true },
  });

  const reference = generateReference("SUB");
  await prisma.payment.create({
    data: {
      reference,
      userId: gate.id,
      subscriptionId: subscription.id,
      amount: plan.price,
      provider: parsed.data.provider,
      purpose: "SUBSCRIPTION",
      status: "PENDING",
    },
  });

  try {
    if (parsed.data.provider === "PAYSTACK") {
      const result = await paystackInitializeTransaction({
        email: user.email,
        amountNaira: Number(plan.price),
        reference,
        callbackUrl: `${APP_URL}/dashboard/billing/callback?provider=PAYSTACK`,
        metadata: { subscriptionId: subscription.id, planId: plan.id },
      });
      return NextResponse.json({ redirectUrl: result.authorizationUrl });
    } else {
      const result = await flutterwaveInitializePayment({
        email: user.email,
        name: user.name,
        phone: user.phone ?? undefined,
        amountNaira: Number(plan.price),
        txRef: reference,
        redirectUrl: `${APP_URL}/dashboard/billing/callback?provider=FLUTTERWAVE`,
        title: `NovaNet — ${plan.name}`,
      });
      return NextResponse.json({ redirectUrl: result.paymentLink });
    }
  } catch (err) {
    console.error("Payment initialization failed:", err);
    return NextResponse.json(
      { error: "Could not start payment. Please try again shortly." },
      { status: 502 }
    );
  }
}
