"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function AutoRenewToggle({ subscriptionId, initial }: { subscriptionId: string; initial: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = React.useState(initial);
  const [loading, setLoading] = React.useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "TOGGLE_AUTO_RENEW" }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not update auto-renew.");
      return;
    }
    setChecked((c) => !c);
    router.refresh();
  }

  return <Switch checked={checked} disabled={loading} onCheckedChange={toggle} />;
}

export function CancelSubscriptionButton({ subscriptionId, planName }: { subscriptionId: string; planName: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function cancel() {
    setLoading(true);
    const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL" }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not cancel subscription.");
      return;
    }
    toast.success("Subscription cancelled.");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}>
        Cancel plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {planName}?</DialogTitle>
            <DialogDescription>
              You'll lose access at the end of your current billing period. This can't be undone from here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep plan
            </Button>
            <Button variant="destructive" onClick={cancel} loading={loading}>
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
