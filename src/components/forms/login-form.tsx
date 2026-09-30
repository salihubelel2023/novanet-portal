"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const suspended = searchParams.get("suspended") === "1";
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      setServerError(
        result.error === "ACCOUNT_SUSPENDED"
          ? "This account has been suspended. Contact support for help."
          : "Incorrect email or password."
      );
      return;
    }

    toast.success("Welcome back!");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Access your NovaNet account.</p>

      {suspended && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-fiber/30 bg-fiber/10 p-3 text-sm text-fiber">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Your account was suspended. Please contact support.
        </div>
      )}
      {serverError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to NovaNet?{" "}
        <Link href="/register" className="font-medium text-signal hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
