import type { Metadata } from "next";
import { Ticket } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { VoucherGenerateForm } from "@/components/forms/voucher-generate-form";
import { BuyVoucherButton } from "@/components/forms/buy-voucher-button";
import { VoucherCard } from "@/components/vouchers/voucher-card";

export const metadata: Metadata = { title: "Vouchers" };

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "danger"> = {
  UNUSED: "secondary",
  ACTIVE: "success",
  USED: "secondary",
  EXPIRED: "danger",
  DISABLED: "danger",
};

export default async function VouchersPage() {
  const user = await requireRole(["ADMIN", "HOTSPOT_USER"]);

  if (user.role === "ADMIN") {
    const [vouchers, hotspotPlans] = await Promise.all([
      prisma.hotspotVoucher.findMany({
        include: { plan: true, redeemedBy: { select: { name: true } }, batch: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.plan.findMany({ where: { type: "HOTSPOT", isActive: true } }),
    ]);

    return (
      <div>
        <PageHeader
          title="Hotspot vouchers"
          description="Generate and track pay-as-you-go access codes."
          actions={<VoucherGenerateForm plans={hotspotPlans.map((p) => ({ id: p.id, name: p.name, price: Number(p.price) }))} />}
        />
        {vouchers.length === 0 ? (
          <EmptyState icon={Ticket} title="No vouchers yet" description="Generate your first batch to get started." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Redeemed by</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.code}</TableCell>
                      <TableCell className="text-muted-foreground">{v.plan.name}</TableCell>
                      <TableCell className="text-muted-foreground">{v.batch?.name ?? "Self-service"}</TableCell>
                      <TableCell className="text-muted-foreground">{v.redeemedBy?.name ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(Number(v.price))}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[v.status]}>{v.status}</Badge>
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

  // HOTSPOT_USER
  const [plans, myVouchers] = await Promise.all([
    prisma.plan.findMany({ where: { type: "HOTSPOT", isActive: true }, orderBy: { price: "asc" } }),
    prisma.hotspotVoucher.findMany({
      where: { redeemedById: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Vouchers" description="Buy Wi-Fi access or check on codes you've used." />

      <div>
        <h2 className="font-display text-lg font-semibold">Buy a voucher</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="flex flex-col rounded-2xl border border-border p-6">
              <h3 className="font-display text-base font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-5 font-display text-2xl font-semibold">{formatCurrency(Number(plan.price))}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.dataCapGB ? `${plan.dataCapGB} GB cap` : "Unlimited data"} · {plan.speedMbps} Mbps
              </p>
              <div className="mt-6">
                <BuyVoucherButton planId={plan.id} planName={plan.name} priceNaira={Number(plan.price)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">Your vouchers</h2>
        {myVouchers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">You haven't bought or redeemed any vouchers yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {myVouchers.map((v) => (
              <VoucherCard
                key={v.id}
                voucher={{
                  code: v.code,
                  planName: v.plan.name,
                  durationHours: v.durationHours,
                  dataCapMB: v.dataCapMB,
                  price: Number(v.price),
                  status: v.status,
                  expiresAt: v.expiresAt?.toISOString(),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
