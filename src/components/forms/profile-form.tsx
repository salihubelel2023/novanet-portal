"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";

export function ProfileForm({
  initial,
  showBusinessName,
}: {
  initial: { name: string; phone: string; address: string; businessName: string };
  showBusinessName: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Could not update profile.");
      return;
    }
    toast.success("Profile updated.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
      </div>

      {showBusinessName && (
        <div className="space-y-1.5">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            value={values.businessName}
            onChange={(e) => setValues({ ...values, businessName: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} />
      </div>

      <Button type="submit" loading={loading}>
        Save changes
      </Button>
    </form>
  );
}
