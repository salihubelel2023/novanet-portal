import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireRole } from "@/lib/rbac";
import { purchaseVoucherSchema } from "@/lib/validations/voucher";
import { paystackInitializeTransaction } from "@/lib/services/paystack";
import { flutterwaveInitializePayment } from "@/lib/services/flutterwave";
import { generateReference } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";

export async function POST(req: Request) {
  const gate = await apiRequireRole(["HOTSPOT_USER"]);
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = purchaseVoucherSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || plan.type !== "HOTSPOT" || !plan.isActive) {
    return NextResponse.json({ error: "This voucher plan is not available" }, { status: 404 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: gate.id } });
  const reference = generateReference("VCH");

  await prisma.payment.create({
    data: {
      reference,
      userId: gate.id,
      amount: plan.price,
      provider: parsed.data.provider,
      purpose: "VOUCHER",
      status: "PENDING",
      metadata: { planId: plan.id },
    },
  });

  try {
    if (parsed.data.provider === "PAYSTACK") {
      const result = await paystackInitializeTransaction({
        email: user.email,
        amountNaira: Number(plan.price),
        reference,
        callbackUrl: `${APP_URL}/dashboard/billing/callback?provider=PAYSTACK`,
        metadata: { planId: plan.id },
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
        title: `NovaNet — ${plan.name} voucher`,
      });
      return NextResponse.json({ redirectUrl: result.paymentLink });
    }
  } catch (err) {
    console.error("Voucher payment initialization failed:", err);
    return NextResponse.json({ error: "Could not start payment. Please try again shortly." }, { status: 502 });
  }
}
