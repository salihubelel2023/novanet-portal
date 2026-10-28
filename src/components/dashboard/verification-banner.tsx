"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Soft-gate banner: shown to signed-in users whose phone number is not yet
 * verified. Login and browsing stay open; only voucher purchases require
 * verification.
 */
export function VerificationBanner({ phone }: { phone: string | null }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  async function sendCode() {
    setSending(true);
    try {
      const res = await fetch("/api/account/verify/request", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not send the code.");
        return;
      }
      if (json.devCode) {
        setDevCode(json.devCode);
        toast.info(`Dev mode: code is ${json.devCode}`);
      } else {
        toast.success(`Code sent to ${phone}.`);
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await fetch("/api/account/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not verify that code.");
        return;
      }
      toast.success("Phone number verified!");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Verify your phone number</p>
          <p className="text-xs text-muted-foreground">
            {phone
              ? `Confirm ${phone} to unlock voucher purchases.`
              : "Add a phone number in Settings, then verify it to unlock voucher purchases."}
          </p>
        </div>
      </div>

      {open ? (
        <form onSubmit={confirm} className="flex items-center gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="6-digit code"
            className="w-36 font-mono tracking-widest"
            required
          />
          <Button type="submit" size="sm" disabled={verifying || code.length !== 6}>
            {verifying ? "Verifying…" : "Confirm"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={sendCode} disabled={sending}>
            {sending ? "Sending…" : "Resend"}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Dismiss"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <Button size="sm" onClick={() => { setOpen(true); void sendCode(); }} disabled={!phone || sending}>
          {sending ? "Sending…" : "Send code"}
        </Button>
      )}

      {devCode && (
        <p className="w-full text-xs text-muted-foreground">
          Dev mode (no SMS key configured): your code is <span className="font-mono font-semibold">{devCode}</span>
        </p>
      )}
    </div>
  );
}
