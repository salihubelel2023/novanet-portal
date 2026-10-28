import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { paystackVerifyTransaction } from "@/lib/services/paystack";
import { flutterwaveVerifyTransaction } from "@/lib/services/flutterwave";
import { fulfillSuccessfulPayment } from "@/lib/services/payment-fulfillment";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { VoucherCard } from "@/components/vouchers/voucher-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your voucher" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(params: SearchParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Public post-payment page for guest (no-account) voucher purchases. The
 * provider redirects here with the payment reference; the random
 * claimToken embedded in the callback URL at initialization time is
 * required before anything about the payment is revealed.
 */
async function loadGuestOutcome(searchParams: SearchParams) {
  const token = first(searchParams, "token");
  const reference =
    first(searchParams, "reference") || first(searchParams, "trxref") || first(searchParams, "tx_ref");

  if (!token || !reference) {
    return { kind: "invalid" as const };
  }

  const payment = await prisma.payment.findUnique({
    where: { reference },
    select: { id: true, status: true, provider: true, purpose: true, guestPhone: true, metadata: true },
  });
  if (!payment || payment.purpose !== "VOUCHER" || !payment.guestPhone) {
    return { kind: "invalid" as const };
  }

  const claimToken = (payment.metadata as { claimToken?: string } | null)?.claimToken;
  if (!claimToken || claimToken !== token) {
    return { kind: "invalid" as const };
  }

  // Still pending? The provider redirected here after the payment attempt,
  // so verify server-side and fulfill — the same double-path (webhook OR
  // callback) that logged-in purchases use, whichever lands first wins.
  if (payment.status === "PENDING") {
    try {
      if (payment.provider === "PAYSTACK") {
        const result = await paystackVerifyTransaction(reference);
        if (result.status === "success") {
          await fulfillSuccessfulPayment({ reference: result.reference, channel: result.channel });
        }
      } else {
        const transactionId = first(searchParams, "transaction_id");
        if (transactionId) {
          const result = await flutterwaveVerifyTransaction(transactionId);
          if (result.status === "successful" && result.txRef === reference) {
            await fulfillSuccessfulPayment({ reference: result.txRef, channel: result.paymentType });
          }
        }
      }
    } catch (err) {
      console.error("Guest payment verification failed:", err);
    }
  }

  const fresh = await prisma.payment.findUnique({
    where: { reference },
    select: {
      status: true,
      guestPhone: true,
      voucher: {
        select: {
          code: true,
          status: true,
          durationHours: true,
          dataCapMB: true,
          price: true,
          plan: { select: { name: true } },
        },
      },
    },
  });
  if (!fresh) return { kind: "invalid" as const };

  if (fresh.status === "SUCCESS" && fresh.voucher) {
    return { kind: "fulfilled" as const, voucher: fresh.voucher, guestPhone: fresh.guestPhone };
  }
  if (fresh.status === "SUCCESS") {
    return { kind: "fulfilled" as const, voucher: null, guestPhone: fresh.guestPhone };
  }
  return { kind: "pending" as const };
}

export default async function GuestVoucherResultPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const outcome = await loadGuestOutcome(resolved);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <div className="container-page flex flex-col items-center py-16">
        {outcome.kind === "invalid" ? (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/12 text-destructive">
              <XCircle className="h-6 w-6" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">Link not recognised</h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              This payment link is invalid or incomplete. If you paid, the voucher code will still arrive by SMS.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild>
                <Link href="/buy">Buy a voucher</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/redeem">Redeem a code</Link>
              </Button>
            </div>
          </div>
        ) : outcome.kind === "pending" ? (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Clock className="h-6 w-6" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">Payment processing</h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              We haven&apos;t received the confirmation yet. If you complete the payment, your voucher code will be
              sent by SMS within a few minutes. Keep this page or check your messages.
            </p>
            <div className="mt-8">
              <Button variant="outline" asChild>
                <Link href="/redeem">Redeem a code</Link>
              </Button>
            </div>
          </div>
        ) : outcome.voucher ? (
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-signal/12 text-signal">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">Your voucher is ready</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We also sent the code by SMS to {outcome.guestPhone}. Redeem it on the redeem page to get online.
              </p>
            </div>
            <div className="mt-8">
              <VoucherCard
                voucher={{
                  code: outcome.voucher.code,
                  planName: outcome.voucher.plan.name,
                  durationHours: outcome.voucher.durationHours,
                  dataCapMB: outcome.voucher.dataCapMB,
                  price: Number(outcome.voucher.price),
                  status: "UNUSED",
                  expiresAt: null,
                }}
              />
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild>
                <Link href="/redeem">Redeem now</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Clock className="h-6 w-6" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">Almost there</h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Your payment was confirmed but the voucher is still being issued. It will arrive by SMS at{" "}
              {outcome.guestPhone} shortly.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
