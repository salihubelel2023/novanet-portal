import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">You don't have access to this page</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your account role doesn't include this section of NovaNet Portal. If you think this is a mistake, contact an administrator.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
