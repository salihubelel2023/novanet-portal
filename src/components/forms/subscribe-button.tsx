"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "@/components/forms/checkout-dialog";

export function SubscribeButton({
  planId,
  planName,
  priceNaira,
  variant = "default",
  label = "Subscribe",
}: {
  planId: string;
  planName: string;
  priceNaira: number;
  variant?: "default" | "outline";
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant={variant} className="w-full" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        amountNaira={priceNaira}
        itemLabel={planName}
        initializeUrl="/api/subscriptions"
        extraBody={{ planId }}
      />
    </>
  );
}
