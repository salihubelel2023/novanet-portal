"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime, cn } from "@/lib/utils";

type NotificationPreview = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link: string | null;
};

export function NotificationBell() {
  const [items, setItems] = React.useState<NotificationPreview[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=6", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.notifications ?? []);
    } catch {
      // Silent — the bell just stays empty; this isn't a critical-path action.
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu onOpenChange={(open) => open && load()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-fiber ring-2 ring-surface" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">You're all caught up.</p>
        )}
        {items.map((n) => (
          <DropdownMenuItem key={n.id} asChild className="flex-col items-start gap-0.5 whitespace-normal">
            <Link href={n.link ?? "/dashboard/notifications"}>
              <span className="flex w-full items-center gap-2">
                {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />}
                <span className={cn("text-sm font-medium", n.isRead && "text-muted-foreground")}>{n.title}</span>
              </span>
              <span className="line-clamp-2 pl-3.5 text-xs text-muted-foreground">{n.message}</span>
              <span className="pl-3.5 text-[11px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="justify-center text-signal">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
