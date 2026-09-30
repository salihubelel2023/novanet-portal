import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="border-t border-border py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-8 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to get your estate, office or kiosk online?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Create an account in minutes, or generate hotspot vouchers for your location today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Create an account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I already have one</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
