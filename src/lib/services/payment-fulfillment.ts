import "server-only";
import { prisma } from "@/lib/prisma";
import { createInvoiceForPayment } from "@/lib/services/invoice";
import { notifyUser } from "@/lib/services/notification";
import { generateVoucherCode } from "@/lib/utils";
import { durationHoursForPlan } from "@/lib/services/voucher";
import type { BillingCycle } from "@prisma/client";

function addBillingCycle(date: Date, cycle: BillingCycle): Date {
  const d = new Date(date);
  switch (cycle) {
    case "HOURLY":
      d.setHours(d.getHours() + 1);
      break;
    case "DAILY":
      d.setDate(d.getDate() + 1);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      break;
    case "ANNUALLY":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

export type FulfillmentOutcome = "already_processed" | "fulfilled" | "not_found";

/**
 * Marks a Payment as SUCCESS and cascades to the thing it paid for
 * (activating a Subscription + issuing an Invoice, or minting a
 * self-service HotspotVoucher). Both the Paystack/Flutterwave webhooks
 * AND the synchronous browser callback page call this same function, so
 * whichever one lands first "wins" and the other is a no-op — payments
 * are never double-fulfilled.
 */
export async function fulfillSuccessfulPayment(params: {
  reference: string;
  channel?: string | null;
}): Promise<FulfillmentOutcome> {
  const payment = await prisma.payment.findUnique({
    where: { reference: params.reference },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment) return "not_found";
  if (payment.status === "SUCCESS") return "already_processed";

  // Atomically claim fulfillment to prevent webhook / callback concurrency race conditions
  const updateResult = await prisma.payment.updateMany({
    where: { id: payment.id, status: { not: "SUCCESS" } },
    data: { status: "SUCCESS", paidAt: new Date(), channel: params.channel },
  });

  if (updateResult.count === 0) {
    return "already_processed";
  }

  if (payment.purpose === "SUBSCRIPTION" && payment.subscription) {
    const now = new Date();
    const endDate = addBillingCycle(now, payment.subscription.plan.billingCycle);

    // Cancel any previous active subscriptions to prevent duplicate active states
    await prisma.subscription.updateMany({
      where: {
        userId: payment.userId,
        id: { not: payment.subscription.id },
        status: "ACTIVE",
      },
      data: { status: "CANCELLED" },
    });

    await prisma.subscription.update({
      where: { id: payment.subscription.id },
      data: { status: "ACTIVE", startDate: now, endDate },
    });

    await createInvoiceForPayment({
      userId: payment.userId,
      subscriptionId: payment.subscription.id,
      paymentId: payment.id,
      amount: Number(payment.amount),
      description: `${payment.subscription.plan.name} subscription`,
    });

    await notifyUser({
      userId: payment.userId,
      title: "Payment successful",
      message: `Your ${payment.subscription.plan.name} subscription is now active.`,
      type: "PAYMENT",
      link: "/dashboard/subscriptions",
    });
  }

  if (payment.purpose === "VOUCHER") {
    // Self-service voucher purchases don't carry a subscriptionId; the
    // plan is recorded in the payment metadata at initialization time.
    const planId = (payment.metadata as { planId?: string } | null)?.planId;
    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (plan) {
        let code = generateVoucherCode();
        // Extremely unlikely collision, but guard anyway.
        while (await prisma.hotspotVoucher.findUnique({ where: { code } })) {
          code = generateVoucherCode();
        }
        await prisma.hotspotVoucher.create({
          data: {
            code,
            planId: plan.id,
            durationHours: durationHoursForPlan(plan),
            dataCapMB: plan.dataCapGB ? plan.dataCapGB * 1024 : null,
            price: plan.price,
            paymentId: payment.id,
            status: "UNUSED",
          },
        });

        await notifyUser({
          userId: payment.userId,
          title: "Voucher ready",
          message: `Your ${plan.name} voucher (${code}) is ready to activate.`,
          type: "VOUCHER",
          link: "/dashboard/vouchers",
        });
      }
    }
  }

  return "fulfilled";
}
