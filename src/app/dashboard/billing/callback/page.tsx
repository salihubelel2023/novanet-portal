import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireAuth } from "@/lib/rbac";
import { paystackVerifyTransaction } from "@/lib/services/paystack";
import { flutterwaveVerifyTransaction } from "@/lib/services/flutterwave";
import { fulfillSuccessfulPayment } from "@/lib/services/payment-fulfillment";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Payment result" };

async function verifyAndFulfill(searchParams: Record<string, string | string[] | undefined>) {
  const provider = searchParams.provider;

  try {
    if (provider === "PAYSTACK") {
      const reference = String(searchParams.reference ?? searchParams.trxref ?? "");
      if (!reference) return { success: false, message: "Missing payment reference." };
      const result = await paystackVerifyTransaction(reference);
      if (result.status !== "success") {
        return { success: false, message: "Your payment was not completed." };
      }
      await fulfillSuccessfulPayment({ reference: result.reference, channel: result.channel });
      return { success: true, message: "Payment confirmed." };
    }

    if (provider === "FLUTTERWAVE") {
      const transactionId = String(searchParams.transaction_id ?? "");
      const txRef = String(searchParams.tx_ref ?? "");
      if (!transactionId || !txRef) return { success: false, message: "Missing payment reference." };
      const result = await flutterwaveVerifyTransaction(transactionId);
      if (result.status !== "successful" || result.txRef !== txRef) {
        return { success: false, message: "Your payment was not completed." };
      }
      await fulfillSuccessfulPayment({ reference: result.txRef, channel: result.paymentType });
      return { success: true, message: "Payment confirmed." };
    }

    return { success: false, message: "Unknown payment provider." };
  } catch (err) {
    console.error("Payment verification failed:", err);
    return { success: false, message: "We couldn't confirm this payment. If you were charged, contact support." };
  }
}

export default async function BillingCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const resolvedParams = await searchParams;
  const outcome = await verifyAndFulfill(resolvedParams);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span
        className={
          outcome.success
            ? "flex h-14 w-14 items-center justify-center rounded-full bg-signal/12 text-signal"
            : "flex h-14 w-14 items-center justify-center rounded-full bg-destructive/12 text-destructive"
        }
      >
        {outcome.success ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
        {outcome.success ? "Payment successful" : "Payment not completed"}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{outcome.message}</p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/dashboard/billing">Go to billing</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
