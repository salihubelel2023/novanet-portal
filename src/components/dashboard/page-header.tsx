import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "signal",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  accent?: "signal" | "fiber" | "sky" | "muted";
}) {
  const accentClasses: Record<string, string> = {
    signal: "bg-signal/12 text-signal",
    fiber: "bg-fiber/12 text-fiber",
    sky: "bg-sky/12 text-sky",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accentClasses[accent])}>
          <Icon className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
