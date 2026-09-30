"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Wifi } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { NAV_ITEMS, SETTINGS_ITEM } from "@/components/layout/nav-config";
import { ICON_MAP } from "@/components/layout/icon-map";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";

export function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1" onClick={onNavigate}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/15 text-signal">
          <Wifi className="h-4 w-4" />
        </span>
        <span className="font-display text-base font-semibold tracking-tight">NovaNet</span>
      </Link>

      <div className="mt-1 px-2">
        <Badge variant="secondary" className="font-normal text-muted-foreground">
          {ROLE_LABELS[role]}
        </Badge>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-2">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-signal/12 text-signal"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border px-2 pt-2">
        {(() => {
          const Icon = ICON_MAP[SETTINGS_ITEM.icon];
          const active = pathname.startsWith(SETTINGS_ITEM.href);
          return (
            <Link
              href={SETTINGS_ITEM.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-signal/12 text-signal" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              Settings
            </Link>
          );
        })()}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}
