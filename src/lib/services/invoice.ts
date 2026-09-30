import "server-only";
import { prisma } from "@/lib/prisma";

async function nextInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(6, "0")}`;
}

/** Create a PAID invoice from a successful subscription payment. */
export async function createInvoiceForPayment(params: {
  userId: string;
  subscriptionId: string;
  paymentId: string;
  amount: number;
  description: string;
}) {
  const invoiceNumber = await nextInvoiceNumber();
  const now = new Date();

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      paymentId: params.paymentId,
      amount: params.amount,
      tax: 0,
      total: params.amount,
      status: "PAID",
      description: params.description,
      dueDate: now,
      issuedAt: now,
    },
  });
}
