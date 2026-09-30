import Link from "next/link";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

const INVOICE_BADGE: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  PAID: "success",
  UNPAID: "warning",
  OVERDUE: "danger",
  CANCELLED: "secondary",
};

const PAYMENT_BADGE: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "danger",
  ABANDONED: "secondary",
};

export default async function BillingPage() {
  const user = await requireRole(ROLE_GROUPS.BILLED_CUSTOMERS);

  if (user.role === "HOTSPOT_USER") {
    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div>
        <PageHeader title="Payment history" description="Every voucher purchase you've made." />
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments yet" description="Your voucher purchases will show up here." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.provider}</TableCell>
                      <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                      <TableCell>
                        <Badge variant={PAYMENT_BADGE[p.status]}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
    include: { subscription: { include: { plan: true } } },
  });

  return (
    <div>
      <PageHeader title="Billing" description="Invoices and payment history for your subscription." />
      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Invoices are generated automatically after each payment." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/dashboard/billing/${inv.id}`} className="font-medium text-signal hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.issuedAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.description}</TableCell>
                    <TableCell>{formatCurrency(Number(inv.total))}</TableCell>
                    <TableCell>
                      <Badge variant={INVOICE_BADGE[inv.status]}>{inv.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
