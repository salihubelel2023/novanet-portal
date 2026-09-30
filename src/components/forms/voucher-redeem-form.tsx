"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { redeemVoucherSchema, type RedeemVoucherInput } from "@/lib/validations/voucher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import { VoucherCard, type VoucherCardData } from "@/components/vouchers/voucher-card";

export function VoucherRedeemForm() {
  const [result, setResult] = React.useState<VoucherCardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RedeemVoucherInput>({ resolver: zodResolver(redeemVoucherSchema) });

  async function onSubmit(values: RedeemVoucherInput) {
    setError(null);
    const res = await fetch("/api/vouchers/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not redeem this voucher.");
      return;
    }
    setResult(json.voucher);
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 rounded-lg border border-signal/30 bg-signal/10 p-3 text-sm text-signal">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          You're connected. Enjoy your NovaNet hotspot access.
        </div>
        <VoucherCard voucher={result} />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setResult(null);
            reset();
          }}
        >
          Redeem another code
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="code">Voucher code</Label>
        <Input
          id="code"
          placeholder="NVN-XXXX-XXXX"
          className="text-center font-mono text-lg tracking-widest"
          autoComplete="off"
          autoCapitalize="characters"
          {...register("code")}
        />
        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
      </div>
      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
        Connect me
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Don't have a code? Vouchers are available from NovaNet kiosks and resellers near you.
      </p>
    </form>
  );
}
