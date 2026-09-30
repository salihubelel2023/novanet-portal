import type { Metadata } from "next";
import { Wifi, Gauge, Database } from "lucide-react";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Check } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { SubscribeButton } from "@/components/forms/subscribe-button";
import { AutoRenewToggle, CancelSubscriptionButton } from "@/components/forms/subscription-actions";

export const metadata: Metadata = { title: "Subscription" };

export default async function SubscriptionsPage() {
  const user = await requireRole(ROLE_GROUPS.CUSTOMERS);

  const [activeSubscription, plans] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ["ACTIVE", "PENDING", "EXPIRED"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({
      where: { type: user.role === "BUSINESS" ? "BUSINESS" : "RESIDENTIAL", isActive: true },
      orderBy: { price: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Subscription" description="Your plan, usage and renewal settings." />

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent>
          {activeSubscription ? (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/12 text-signal">
                    <Wifi className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold">{activeSubscription.plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(Number(activeSubscription.plan.price))} / {activeSubscription.plan.billingCycle.toLowerCase()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      activeSubscription.status === "ACTIVE"
                        ? "success"
                        : activeSubscription.status === "EXPIRED"
                          ? "danger"
                          : "warning"
                    }
                    className="ml-2"
                  >
                    {activeSubscription.status}
                  </Badge>
                </div>
                <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="h-4 w-4" /> {activeSubscription.plan.speedMbps} Mbps
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Database className="h-4 w-4" />
                    {activeSubscription.plan.dataCapGB ? `${activeSubscription.plan.dataCapGB} GB` : "Unlimited"}
                  </span>
                  {activeSubscription.plan.deviceLimit && (
                    <span className="flex items-center gap-1.5">
                      <Wifi className="h-4 w-4" /> {activeSubscription.plan.deviceLimit} devices
                    </span>
                  )}
                </div>
                {activeSubscription.endDate && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {activeSubscription.status === "ACTIVE"
                      ? "Renews"
                      : activeSubscription.status === "EXPIRED"
                        ? "Expired on"
                        : "Expires"}{" "}
                    {formatDate(activeSubscription.endDate)}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-start gap-4 sm:items-end">
                {activeSubscription.status === "ACTIVE" ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Auto-renew</span>
                      <AutoRenewToggle subscriptionId={activeSubscription.id} initial={activeSubscription.autoRenew} />
                    </div>
                    <CancelSubscriptionButton subscriptionId={activeSubscription.id} planName={activeSubscription.plan.name} />
                  </>
                ) : (
                  <Badge variant={activeSubscription.status === "EXPIRED" ? "danger" : "warning"}>
                    {activeSubscription.status === "EXPIRED" ? "Action required: Renew to restore access" : "Pending activation"}
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <EmptyState icon={Wifi} title="No active plan" description="Pick a plan below to get connected." />
          )}
        </CardContent>
      </Card>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">
          {activeSubscription ? "Change plan" : "Available plans"}
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = activeSubscription?.planId === plan.id && activeSubscription.status === "ACTIVE";
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6",
                  plan.isPopular ? "border-signal shadow-glow" : "border-border"
                )}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-signal px-3 py-1 text-xs font-semibold text-signal-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-base font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-semibold">{formatCurrency(Number(plan.price))}</span>
                  <span className="text-xs text-muted-foreground">/{plan.billingCycle.toLowerCase()}</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-signal" /> {plan.speedMbps} Mbps speed
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-signal" />
                    {plan.dataCapGB ? `${plan.dataCapGB} GB monthly cap` : "Unlimited data"}
                  </li>
                  {plan.deviceLimit && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-signal" /> Up to {plan.deviceLimit} connected devices
                    </li>
                  )}
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-signal" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <Badge variant="success" className="w-full justify-center py-2">
                      Current plan
                    </Badge>
                  ) : (
                    <SubscribeButton
                      planId={plan.id}
                      planName={plan.name}
                      priceNaira={Number(plan.price)}
                      variant={plan.isPopular ? "default" : "outline"}
                      label={activeSubscription ? "Switch to this plan" : "Subscribe"}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {plans.length === 0 && (
          <EmptyState icon={Wifi} title="No plans available yet" description="Ask an administrator to add plans." />
        )}
      </div>
    </div>
  );
}
