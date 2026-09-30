import type { Metadata } from "next";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { VoucherRedeemForm } from "@/components/forms/voucher-redeem-form";

export const metadata: Metadata = { title: "Redeem a hotspot voucher" };

export default function RedeemPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <div className="container-page flex flex-col items-center py-20">
        <div className="w-full max-w-md">
          <div className="text-center">
            <span className="eyebrow">Hotspot access</span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Redeem your voucher</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the code from your scratch card or receipt to get online.
            </p>
          </div>
          <div className="mt-10">
            <VoucherRedeemForm />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
