import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PlanForm } from "@/components/forms/plan-form";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Plans" };

export default async function PlansPage() {
  await requireRole(ROLE_GROUPS.ADMIN_ONLY);

  const plans = await prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true, vouchers: true } } },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });

  return (
    <div>
      <PageHeader title="Plans" description="Residential, business and hotspot plans." actions={<PlanForm />} />

      {plans.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="No plans yet" description="Create your first plan to start onboarding customers." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Speed / Cap</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{plan.name}</p>
                        {plan.district && (
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {plan.district}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{plan.type}</TableCell>
                    <TableCell>
                      {formatCurrency(Number(plan.price))}
                      <span className="text-xs text-muted-foreground">/{plan.billingCycle.toLowerCase()}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.speedMbps} Mbps · {plan.dataCapGB ? `${plan.dataCapGB} GB` : "Unlimited"}
                      {plan.deviceLimit ? ` · ${plan.deviceLimit} devices` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.type === "HOTSPOT" ? plan._count.vouchers : plan._count.subscriptions}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? "success" : "secondary"}>{plan.isActive ? "Active" : "Inactive"}</Badge>
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
