import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetworkPulse } from "@/components/marketing/network-pulse";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="container-page relative grid gap-12 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:pb-32 lg:pt-24">
        <div className="animate-fade-up">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-signal" />
            Licensed managed ISP · Nigeria
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            Internet infrastructure,
            <br />
            run like software.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            NovaNet connects estates, businesses and pay-as-you-go hotspot users on one
            network — and gives your team a single console to provision, bill, monitor
            and support all of it.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Get connected <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/redeem">Redeem a hotspot voucher</Link>
            </Button>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
            {[
              ["99.9%", "network uptime"],
              ["24/7", "field support"],
              ["<24h", "install turnaround"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-xl font-semibold">{value}</dt>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-fade-up [animation-delay:150ms]">
          <div className="rounded-2xl border border-border bg-surface/60 p-4 shadow-elevated backdrop-blur">
            <NetworkPulse className="h-auto w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
