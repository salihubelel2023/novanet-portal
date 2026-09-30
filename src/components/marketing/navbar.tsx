"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Wifi, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "/redeem", label: "Redeem voucher" },
];

export function MarketingNavbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/15 text-signal">
            <Wifi className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">NovaNet</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get connected</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm text-muted-foreground">
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get connected</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
