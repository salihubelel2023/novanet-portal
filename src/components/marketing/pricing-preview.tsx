import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const TIERS = [
  {
    name: "Resident",
    price: 15000,
    cycle: "/month",
    description: "One access point per home, sized to your household.",
    features: ["Up to 10 connected devices", "Unlimited data", "Free installation", "Standard support"],
    popular: false,
  },
  {
    name: "Business",
    price: 45000,
    cycle: "/month",
    description: "Scales with your business — shops to multi-branch offices.",
    features: ["From 15 connected devices", "Unlimited data", "Priority technician SLA", "Custom quotes available"],
    popular: true,
  },
  {
    name: "Hotspot",
    price: 500,
    cycle: "/day pass",
    description: "Pay-as-you-go Wi-Fi, no contract — from ₦100/hour.",
    features: ["1-hour to 30-day passes", "QR or code redemption", "No account required", "Resell-ready"],
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
          Indicative pricing — exact plans and prices are configured by NovaNet admins and may vary by estate.
        </p>
      </div>
    </section>
  );
}
