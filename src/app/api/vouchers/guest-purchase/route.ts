import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { guestPurchaseSchema } from "@/lib/validations/voucher";
import { paystackInitializeTransaction } from "@/lib/services/paystack";
import { flutterwaveInitializePayment } from "@/lib/services/flutterwave";
import { generateReference } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Guest (no-account) voucher purchase. Anyone with the page URL can call
 * this, so it is rate-limited aggressively and every initiation creates a
 * PENDING payment + provider checkout session — no voucher exists until
 * the provider webhook/callback confirms payment.
 */
const GUEST_LIMIT = 5;
const GUEST_WINDOW_MS = 10 * 60_000;

export async function POST(req: Request) {
  const limit = rateLimit(`guest-purchase:${getClientIp(req)}`, GUEST_LIMIT, GUEST_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = guestPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || plan.type !== "HOTSPOT" || !plan.isActive) {
    return NextResponse.json({ error: "This voucher plan is not available" }, { status: 404 });
  }

  // Random token carried through the provider callback URL; the public
  // result page requires it before revealing anything about the payment.
  const claimToken = crypto.randomBytes(24).toString("hex");
  const reference = generateReference("VCH");

  await prisma.payment.create({
    data: {
      reference,
      userId: null,
      guestPhone: parsed.data.phone,
      guestEmail: parsed.data.email.toLowerCase(),
      amount: plan.price,
      provider: parsed.data.provider,
      purpose: "VOUCHER",
      status: "PENDING",
      metadata: { planId: plan.id, claimToken },
    },
  });

  const resultUrl = `${APP_URL}/pay/voucher?token=${claimToken}`;

  try {
    if (parsed.data.provider === "PAYSTACK") {
      const result = await paystackInitializeTransaction({
        email: parsed.data.email,
        amountNaira: Number(plan.price),
        reference,
        callbackUrl: resultUrl,
        metadata: { planId: plan.id, guest: true },
      });
      return NextResponse.json({ redirectUrl: result.authorizationUrl });
    } else {
      const result = await flutterwaveInitializePayment({
        email: parsed.data.email,
        name: "NovaNet guest",
        phone: parsed.data.phone,
        amountNaira: Number(plan.price),
        txRef: reference,
        redirectUrl: resultUrl,
        title: `NovaNet — ${plan.name} voucher`,
      });
      return NextResponse.json({ redirectUrl: result.paymentLink });
    }
  } catch (err) {
    console.error("Guest voucher payment initialization failed:", err);
    return NextResponse.json({ error: "Could not start payment. Please try again shortly." }, { status: 502 });
  }
}
