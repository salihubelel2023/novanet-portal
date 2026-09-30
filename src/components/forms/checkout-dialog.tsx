"use client";

import * as React from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

type Provider = "PAYSTACK" | "FLUTTERWAVE";

export function CheckoutDialog({
  open,
  onOpenChange,
  amountNaira,
  itemLabel,
  initializeUrl,
  extraBody,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountNaira: number;
  itemLabel: string;
  initializeUrl: string;
  extraBody: Record<string, unknown>;
}) {
  const [provider, setProvider] = React.useState<Provider>("PAYSTACK");
  const [loading, setLoading] = React.useState(false);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch(initializeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...extraBody, provider }),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm payment</DialogTitle>
          <DialogDescription>
            {itemLabel} — {formatCurrency(amountNaira)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {(["PAYSTACK", "FLUTTERWAVE"] as Provider[]).map((p) => (
            <button
              key={p}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={pay} loading={loading}>
            Pay {formatCurrency(amountNaira)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
