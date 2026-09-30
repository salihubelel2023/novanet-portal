"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "@/components/forms/checkout-dialog";

export function BuyVoucherButton({ planId, planName, priceNaira }: { planId: string; planName: string; priceNaira: number }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        Buy voucher
      </Button>
      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        amountNaira={priceNaira}
        itemLabel={planName}
        initializeUrl="/api/vouchers/purchase"
        extraBody={{ planId }}
      />
    </>
  );
}
