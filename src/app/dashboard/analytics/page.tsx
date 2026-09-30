import type { Metadata } from "next";
import { Wallet, Users, Wifi, LifeBuoy } from "lucide-react";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart";
import { PlanDistributionChart } from "@/components/dashboard/charts/plan-distribution-chart";
import { TicketStatusChart } from "@/components/dashboard/charts/ticket-status-chart";
import { formatCurrencyCompact } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireRole(ROLE_GROUPS.ADMIN_ONLY);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [payments, activeSubsByPlan, ticketCounts, userCount, activeSubCount, voucherRedemptions] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "SUCCESS", paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
    prisma.subscription.groupBy({
      by: ["planId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.hotspotVoucher.count({ where: { status: { in: ["ACTIVE", "USED"] } } }),
  ]);

  // Bucket revenue by month label, e.g. "Feb", "Mar", ...
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-NG", { month: "short" }) });
  }
  const revenueByMonth = months.map(({ key, label }) => {
    const total = payments
      .filter((p) => p.paidAt && `${p.paidAt.getFullYear()}-${p.paidAt.getMonth()}` === key)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { month: label, revenue: total };
  });
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const planIds = activeSubsByPlan.map((g) => g.planId);
  const plans = await prisma.plan.findMany({ where: { id: { in: planIds } } });
  const planDistribution = activeSubsByPlan.map((g) => ({
    name: plans.find((p) => p.id === g.planId)?.name ?? "Unknown",
    subscribers: g._count._all,
  }));

  const ticketData = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) => ({
    name: status === "IN_PROGRESS" ? "In progress" : status.charAt(0) + status.slice(1).toLowerCase(),
    value: ticketCounts.find((t) => t.status === status)?._count._all ?? 0,
  }));

  return (
    <div>
      <PageHeader title="Analytics" description="Revenue, adoption and support performance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (6 months)" value={formatCurrencyCompact(totalRevenue)} icon={Wallet} accent="signal" />
        <StatCard label="Total users" value={userCount.toLocaleString()} icon={Users} accent="sky" />
        <StatCard label="Active subscriptions" value={activeSubCount.toLocaleString()} icon={Wifi} accent="fiber" />
        <StatCard label="Vouchers redeemed" value={voucherRedemptions.toLocaleString()} icon={LifeBuoy} accent="muted" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Successful payments over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueByMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets by status</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketStatusChart data={ticketData} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Active subscriptions by plan</CardTitle>
        </CardHeader>
        <CardContent>
          {planDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active subscriptions yet.</p>
          ) : (
            <PlanDistributionChart data={planDistribution} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
