import Link from "next/link";
import { Wifi } from "lucide-react";
import { NetworkPulse } from "@/components/marketing/network-pulse";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 sm:p-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/15 text-signal">
            <Wifi className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">NovaNet</span>
        </Link>

        <div className="mx-auto w-full max-w-sm py-12">{children}</div>

        <p className="text-center text-xs text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} NovaNet Portal
        </p>
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden border-l border-border bg-surface lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
        <div className="relative max-w-md px-10">
          <NetworkPulse className="h-auto w-full" />
          <p className="mt-6 text-center font-display text-lg font-medium">
            One console for every connection you manage.
          </p>
        </div>
      </div>
    </div>
  );
}
