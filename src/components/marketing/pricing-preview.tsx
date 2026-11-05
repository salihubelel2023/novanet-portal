import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const TIERS = [
  {
    name: "Basic",
    price: 30000,
    cycle: "/month",
    description: "Reliable fiber for everyday home use, one simple price.",
    speed: "35 Mbps",
    features: ["Up to 10 connected devices", "Unlimited data", "Free installation", "Standard support"],
    popular: false,
  },
  {
    name: "Standard",
    price: 45000,
    cycle: "/month",
    description: "High-speed urban fiber for busy households and home offices.",
    speed: "60 Mbps",
    features: ["Up to 15 connected devices", "Unlimited data", "Free installation", "Priority support"],
    popular: true,
  },
  {
    name: "Premium",
    price: 60000,
    cycle: "/month",
    description: "Top-tier speeds for smart homes and power users.",
    speed: "100 Mbps",
    features: ["Up to 30 connected devices", "Unlimited data", "Dedicated access point", "24/7 VIP priority support"],
    popular: false,
  },
];

export function PricingPreview() {
  return (
    <section id="pricing" className="border-t border-border py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">Simple, Naira-first pricing</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            One network, three ways to connect
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                tier.popular ? "border-signal shadow-glow" : "border-border"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-7 rounded-full bg-signal px-3 py-1 text-xs font-semibold text-signal-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
              <p className="mt-2 text-xs font-medium text-signal">{tier.speed}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold tracking-tight">
                  {formatCurrency(tier.price)}
                </span>
                <span className="text-sm text-muted-foreground">{tier.cycle}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" variant={tier.popular ? "default" : "outline"} asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          One price for every customer, everywhere we operate in Abuja. Pay-as-you-go hotspot passes are available on the
          buy voucher page.
        </p>
      </div>
    </section>
  );
}
