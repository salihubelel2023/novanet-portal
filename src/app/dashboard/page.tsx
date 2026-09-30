import Link from "next/link";
import type { Metadata } from "next";
import {
  Users,
  Wallet,
  LifeBuoy,
  Wrench,
  Radio,
  ArrowRight,
  Wifi,
  Receipt,
} from "lucide-react";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatCurrencyCompact, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const user = await requireAuth();

  if (user.role === "ADMIN") return <AdminOverview />;
  if (user.role === "TECHNICIAN") return <TechnicianOverview userId={user.id} />;
  if (user.role === "HOTSPOT_USER") return <HotspotOverview userId={user.id} />;
  return <CustomerOverview userId={user.id} />;
}

// ── Admin ─────────────────────────────────────────────────────────────
async function AdminOverview() {
  const [userCount, activeSubs, openTickets, monthRevenueAgg, recentTickets] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "SUCCESS",
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Everything happening across NovaNet right now."
        actions={
          <Button asChild>
            <Link href="/dashboard/analytics">
              Full analytics <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={userCount.toLocaleString()} icon={Users} accent="signal" />
        <StatCard label="Active subscriptions" value={activeSubs.toLocaleString()} icon={Wifi} accent="sky" />
        <StatCard
          label="Revenue this month"
          value={formatCurrencyCompact(Number(monthRevenueAgg._sum.amount ?? 0))}
          icon={Wallet}
          accent="fiber"
        />
        <StatCard label="Open tickets" value={openTickets.toLocaleString()} icon={LifeBuoy} accent="muted" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent support tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentTickets.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={LifeBuoy} title="No tickets yet" description="New support requests will show up here." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentTickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/dashboard/support/${t.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.user.name} · {t.ticketNumber}
                      </p>
                    </div>
                    <Badge variant={t.status === "OPEN" ? "warning" : t.status === "RESOLVED" ? "success" : "secondary"}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Technician ───────────────────────────────────────────────────────
async function TechnicianOverview({ userId }: { userId: string }) {
  const [assignedJobs, activeJobs, assignedTickets] = await Promise.all([
    prisma.technicianJob.count({ where: { technicianId: userId } }),
    prisma.technicianJob.findMany({
      where: { technicianId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      include: { customer: { select: { name: true } }, estate: { select: { name: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.supportTicket.count({ where: { assignedToId: userId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  return (
    <div>
      <PageHeader title="Field overview" description="Your jobs and assigned tickets." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total jobs" value={assignedJobs.toString()} icon={Wrench} accent="signal" />
        <StatCard label="Open jobs" value={activeJobs.length.toString()} icon={Radio} accent="sky" />
        <StatCard label="Assigned tickets" value={assignedTickets.toString()} icon={LifeBuoy} accent="fiber" />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Upcoming jobs</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/jobs">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {activeJobs.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={Wrench} title="No open jobs" description="New installations and repairs will appear here." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {activeJobs.map((job) => (
                <li key={job.id}>
                  <Link href={`/dashboard/jobs/${job.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium">
                        {job.type.charAt(0) + job.type.slice(1).toLowerCase()} · {job.jobNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.customer?.name ?? "Unassigned customer"} {job.estate ? `· ${job.estate.name}` : ""}
                      </p>
                    </div>
                    <Badge variant={job.status === "ASSIGNED" ? "warning" : "sky"}>{job.status.replace("_", " ")}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Hotspot user ─────────────────────────────────────────────────────
async function HotspotOverview({ userId }: { userId: string }) {
  const [activeVoucher, recentVouchers] = await Promise.all([
    prisma.hotspotVoucher.findFirst({
      where: { redeemedById: userId, status: "ACTIVE" },
      include: { plan: true },
    }),
    prisma.hotspotVoucher.findMany({
      where: { redeemedById: userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const timeLeftPct = activeVoucher?.expiresAt
    ? Math.max(
        0,
        Math.min(
          100,
          ((activeVoucher.expiresAt.getTime() - Date.now()) /
            (activeVoucher.durationHours * 60 * 60 * 1000)) *
            100
        )
      )
    : 0;

  return (
    <div>
      <PageHeader
        title="Your hotspot"
        description="Manage your Wi-Fi access."
        actions={
          <Button asChild>
            <Link href="/dashboard/vouchers">Buy a voucher</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          {activeVoucher ? (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/12 text-signal">
                    <Wifi className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold">{activeVoucher.plan.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{activeVoucher.code}</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Time remaining</span>
                  <span>{activeVoucher.expiresAt ? formatDate(activeVoucher.expiresAt) : "—"}</span>
                </div>
                <Progress value={timeLeftPct} />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Wifi}
              title="No active session"
              description="Redeem or purchase a voucher to get connected."
              action={
                <Button asChild>
                  <Link href="/dashboard/vouchers">Buy a voucher</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent vouchers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentVouchers.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">You haven't used any vouchers yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentVouchers.map((v) => (
                <li key={v.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-mono text-sm">{v.code}</p>
                    <p className="text-xs text-muted-foreground">{v.plan.name}</p>
                  </div>
                  <Badge variant={v.status === "ACTIVE" ? "success" : v.status === "EXPIRED" ? "danger" : "secondary"}>
                    {v.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Resident / Business ──────────────────────────────────────────────
async function CustomerOverview({ userId }: { userId: string }) {
  const [subscription, recentInvoices, openTickets] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PENDING"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({ where: { userId }, orderBy: { issuedAt: "desc" }, take: 4 }),
    prisma.supportTicket.count({ where: { userId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Welcome back"
        description="Here's what's happening with your NovaNet connection."
        actions={
          <Button asChild>
            <Link href="/dashboard/support">Raise a ticket</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg font-semibold">{subscription.plan.name}</p>
                    <Badge variant={subscription.status === "ACTIVE" ? "success" : "warning"}>{subscription.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subscription.plan.speedMbps} Mbps ·{" "}
                    {subscription.plan.dataCapGB ? `${subscription.plan.dataCapGB} GB cap` : "Unlimited data"}
                  </p>
                  {subscription.endDate && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Renews {formatDate(subscription.endDate)}
                    </p>
                  )}
                </div>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/subscriptions">Manage plan</Link>
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={Wifi}
                title="No active plan"
                description="Choose a plan to get your address connected."
                action={
                  <Button asChild>
                    <Link href="/dashboard/subscriptions">Browse plans</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <StatCard label="Open tickets" value={openTickets.toString()} icon={LifeBuoy} accent="fiber" />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent invoices</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/billing">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentInvoices.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={Receipt} title="No invoices yet" />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link href={`/dashboard/billing/${inv.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.issuedAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{formatCurrency(Number(inv.total))}</span>
                      <Badge variant={inv.status === "PAID" ? "success" : "warning"}>{inv.status}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
