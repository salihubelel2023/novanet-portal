"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { generateVouchersSchema, type GenerateVouchersInput } from "@/lib/validations/voucher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

type HotspotPlanOption = { id: string; name: string; price: number };

export function VoucherGenerateForm({ plans }: { plans: HotspotPlanOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenerateVouchersInput>({
    resolver: zodResolver(generateVouchersSchema),
    defaultValues: { quantity: 10 },
  });

  const planId = watch("planId");

  async function onSubmit(values: GenerateVouchersInput) {
    const res = await fetch("/api/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Could not generate vouchers.");
      return;
    }
    toast.success(`${values.quantity} vouchers generated.`);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Generate vouchers
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate voucher batch</DialogTitle>
          <DialogDescription>Create a batch of unique, unused hotspot vouchers.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Hotspot plan</Label>
            <Select onValueChange={(v) => setValue("planId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planId && <p className="text-xs text-destructive">Select a plan</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" min={1} max={500} {...register("quantity")} />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="batchName">Batch name (optional)</Label>
            <Input id="batchName" placeholder="e.g. Estate Kiosk — July" {...register("batchName")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!planId}>
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
