import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { GuestCheckoutForm } from "@/components/forms/guest-checkout-form";

export const metadata: Metadata = { title: "Buy a hotspot voucher" };

export default async function BuyVoucherPage() {
  const plans = await prisma.plan.findMany({
    where: { type: "HOTSPOT", isActive: true },
    orderBy: { price: "asc" },
    select: { id: true, name: true, description: true, price: true, speedMbps: true, dataCapGB: true },
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <div className="container-page flex flex-col items-center py-16">
        <div className="w-full max-w-xl">
          <div className="text-center">
            <span className="eyebrow">Hotspot access</span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Buy a Wi-Fi voucher</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No account needed — pay, get your code by SMS, and redeem it to get online.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <GuestCheckoutForm
              plans={plans.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: Number(p.price),
                speedMbps: p.speedMbps,
                dataCapGB: p.dataCapGB,
              }))}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
