import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Wifi } from "lucide-react";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Separator } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/dashboard/print-button";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Invoice" };

const INVOICE_BADGE: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  PAID: "success",
  UNPAID: "warning",
  OVERDUE: "danger",
  CANCELLED: "secondary",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const user = await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: true,
      subscription: { include: { plan: true } },
      payment: true,
    },
  });

  if (!invoice) notFound();
  if (invoice.userId !== user.id && user.role !== "ADMIN") notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div />
        <PrintButton />
      </div>

      <Card>
        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/15 text-signal">
                  <Wifi className="h-4 w-4" />
                </span>
                <span className="font-display text-lg font-semibold">{APP_NAME}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">NovaNet Communications Ltd.</p>
              <p className="text-sm text-muted-foreground">Lagos, Nigeria</p>
            </div>
            <div className="text-left sm:text-right">
              <h1 className="font-display text-xl font-semibold">{invoice.invoiceNumber}</h1>
              <Badge variant={INVOICE_BADGE[invoice.status]} className="mt-2">
                {invoice.status}
              </Badge>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billed to</p>
              <p className="mt-2 text-sm font-medium">{invoice.user.businessName || invoice.user.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.user.email}</p>
              {invoice.user.address && <p className="text-sm text-muted-foreground">{invoice.user.address}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issued</p>
              <p className="mt-2 text-sm">{formatDate(invoice.issuedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due</p>
              <p className="mt-2 text-sm">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3">
                    {invoice.description}
                    {invoice.subscription && (
                      <span className="block text-xs text-muted-foreground">
                        {invoice.subscription.plan.speedMbps} Mbps ·{" "}
                        {invoice.subscription.plan.dataCapGB ? `${invoice.subscription.plan.dataCapGB} GB` : "Unlimited"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(Number(invoice.amount))}</td>
                </tr>
                {Number(invoice.tax) > 0 && (
                  <tr className="border-t border-border text-muted-foreground">
                    <td className="px-4 py-3">Tax</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(invoice.tax))}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-surface-2 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(Number(invoice.total))}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {invoice.payment && (
            <p className="mt-6 text-xs text-muted-foreground">
              Paid via {invoice.payment.provider} · Reference {invoice.payment.reference}
            </p>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Thank you for choosing {APP_NAME}. Questions about this invoice? Raise a billing ticket from your dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
