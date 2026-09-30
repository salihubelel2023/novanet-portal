"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { AlertCircle, Building2, Home, Wifi } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES = [
  { value: "RESIDENT", label: "Resident", icon: Home, description: "Home internet" },
  { value: "BUSINESS", label: "Business", icon: Building2, description: "Office / company" },
  { value: "HOTSPOT_USER", label: "Hotspot", icon: Wifi, description: "Pay-as-you-go" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: "RESIDENT" },
  });

  const accountType = watch("accountType");

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error ?? "Something went wrong. Please try again.");
      return;
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      toast.success("Account created — please log in.");
      router.push("/login");
      return;
    }

    toast.success("Welcome to NovaNet!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Get connected in a couple of minutes.</p>

      {serverError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setValue("accountType", type.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors",
                accountType === type.value
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-border text-muted-foreground hover:border-signal/40"
              )}
            >
              <type.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Ada Obi" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {accountType === "BUSINESS" && (
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" placeholder="Obi Logistics Ltd" {...register("businessName")} />
            {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="0803 000 0000" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </div>

        {accountType !== "HOTSPOT_USER" && (
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="12 Palm Avenue, Lekki" {...register("address")} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-signal hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
