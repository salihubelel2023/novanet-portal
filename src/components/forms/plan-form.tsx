"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { planSchema, type PlanInput } from "@/lib/validations/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/switch";
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

export function PlanForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPopular, setIsPopular] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: { isActive: true, isPopular: false, features: [] },
  });

  async function onSubmit(values: PlanInput) {
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, isPopular }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Could not create plan.");
      return;
    }
    toast.success("Plan created.");
    setOpen(false);
    reset();
    setIsPopular(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a plan</DialogTitle>
          <DialogDescription>Plans appear immediately to matching account types.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Home Pro 50" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} placeholder="Short one-line summary" {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select onValueChange={(v) => setValue("type", v as PlanInput["type"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Billing cycle</Label>
              <Select onValueChange={(v) => setValue("billingCycle", v as PlanInput["billingCycle"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.billingCycle && <p className="text-xs text-destructive">Required</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (₦)</Label>
              <Input id="price" type="number" min={0} {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="speedMbps">Speed (Mbps)</Label>
              <Input id="speedMbps" type="number" min={1} {...register("speedMbps")} />
              {errors.speedMbps && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceLimit">Devices / AP</Label>
              <Input id="deviceLimit" type="number" min={1} placeholder="Blank = unrestricted" {...register("deviceLimit")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dataCapGB">Data cap (GB, optional)</Label>
            <Input id="dataCapGB" type="number" min={1} placeholder="Blank = unlimited" {...register("dataCapGB")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="durationHours">Voucher duration in hours (hotspot plans only)</Label>
            <Input
              id="durationHours"
              type="number"
              min={1}
              placeholder="e.g. 3 for a 3-hour pass — blank uses the billing cycle"
              {...register("durationHours")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="features">Extra features (comma separated)</Label>
            <Input
              id="features"
              placeholder="Free installation, Static IP"
              onChange={(e) => setValue("features", e.target.value.split(",").map((f) => f.trim()).filter(Boolean))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <Label htmlFor="isPopular" className="cursor-pointer">
              Mark as "Most popular"
            </Label>
            <Switch id="isPopular" checked={isPopular} onCheckedChange={setIsPopular} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
