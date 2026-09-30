"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { cn, formatRelativeTime } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = React.useState<NotificationItem[] | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/notifications?limit=50", { cache: "no-store" });
    const json = await res.json();
    setItems(json.notifications ?? []);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    load();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? prev);
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Updates about your account, payments and support requests."
        actions={
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />

      {items === null && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {items?.length === 0 && <EmptyState icon={Bell} title="No notifications yet" description="You're all caught up." />}

      {items && items.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "#"}
                    onClick={() => !n.isRead && markRead(n.id)}
                    className={cn("flex items-start gap-3 px-6 py-4 hover:bg-accent/40", !n.isRead && "bg-signal/[0.04]")}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-signal")} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className={cn("text-sm font-medium", n.isRead && "text-muted-foreground")}>{n.title}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
