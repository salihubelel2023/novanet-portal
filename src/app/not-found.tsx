import Link from "next/link";
import { Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-signal/12 text-signal">
        <Wifi className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">404 — signal lost</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn't find the page you were looking for.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
