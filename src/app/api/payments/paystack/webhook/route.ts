import { NextResponse } from "next/server";
import { verifyPaystackWebhookSignature } from "@/lib/services/paystack";
import { fulfillSuccessfulPayment } from "@/lib/services/payment-fulfillment";

/**
 * Paystack POSTs here on every transaction event. We verify the
 * x-paystack-signature HMAC before trusting anything in the body — see
 * verifyPaystackWebhookSignature for why this must run against the raw
 * request text, not a re-serialized JSON.parse() of it.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success" && event.data?.status === "success") {
    await fulfillSuccessfulPayment({
      reference: event.data.reference,
      channel: event.data.channel,
    });
  }

  // Always 200 quickly so Paystack doesn't retry-storm us; unknown event
  // types are simply ignored.
  return NextResponse.json({ received: true });
}
