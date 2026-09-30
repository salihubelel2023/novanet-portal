import { NextResponse } from "next/server";
import { verifyFlutterwaveWebhookSignature } from "@/lib/services/flutterwave";
import { fulfillSuccessfulPayment } from "@/lib/services/payment-fulfillment";

export async function POST(req: Request) {
  const signature = req.headers.get("verif-hash");
  if (!verifyFlutterwaveWebhookSignature(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await req.json();

  if (event.event === "charge.completed" && event.data?.status === "successful") {
    await fulfillSuccessfulPayment({
      reference: event.data.tx_ref,
      channel: event.data.payment_type,
    });
  }

  return NextResponse.json({ received: true });
}
