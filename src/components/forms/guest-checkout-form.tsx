"use client";

import * as React from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import { cn, formatCurrency } from "@/lib/utils";

type Provider = "PAYSTACK" | "FLUTTERWAVE";

export type GuestPlanOption = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  speedMbps: number;
  dataCapGB: number | null;
};

/**
 * No-account voucher checkout: pick a plan, leave a phone number (the code
 * is delivered by SMS) and an email for the payment receipt, then pay.
 */
export function GuestCheckoutForm({ plans }: { plans: GuestPlanOption[] }) {
  const [planId, setPlanId] = React.useState(plans[0]?.id ?? "");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [provider, setProvider] = React.useState<Provider>("PAYSTACK");
  const [loading, setLoading] = React.useState(false);

  const selected = plans.find((p) => p.id === planId);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/vouchers/guest-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, provider, phone, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not start payment.");
        setLoading(false);
        return;
      }
      window.location.href = json.redirectUrl;
    } catch {
      toast.error("Network error — please try again.");
      setLoading(false);
    }
  }

  if (plans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hotspot plans are available right now. Please check back soon.
      </p>
    );
  }

  return (
    <form onSubmit={pay} className="space-y-6">
      <div>
        <Label>Choose a plan</Label>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setPlanId(plan.id)}
              className={cn(
                "rounded-xl border px-4 py-4 text-left transition-colors",
                planId === plan.id ? "border-signal bg-signal/10" : "border-border hover:border-signal/40"
              )}
            >
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-1 font-display text-lg font-semibold">{formatCurrency(plan.price)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.speedMbps} Mbps · {plan.dataCapGB ? `${plan.dataCapGB} GB cap` : "Unlimited data"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="guest-phone">Phone number (code is sent here)</Label>
          <Input
            id="guest-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812 345 6789"
            inputMode="tel"
            required
          />
        </div>
        <div>
          <Label htmlFor="guest-email">Email (receipt)</Label>
          <Input
            id="guest-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div>
        <Label>Pay with</Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(["PAYSTACK", "FLUTTERWAVE"] as Provider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border px-4 py-5 text-sm font-medium transition-colors",
                provider === p ? "border-signal bg-signal/10 text-signal" : "border-border text-muted-foreground hover:border-signal/40"
              )}
            >
              <CreditCard className="h-5 w-5" />
              {p === "PAYSTACK" ? "Paystack" : "Flutterwave"}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !selected}>
        {loading ? "Starting payment…" : selected ? `Pay ${formatCurrency(selected.price)}` : "Select a plan"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No account needed. Your voucher code arrives by SMS right after payment.
      </p>
    </form>
  );
}
