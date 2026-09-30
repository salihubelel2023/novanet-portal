import { MarketingNavbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { Cta } from "@/components/marketing/cta";
import { Footer } from "@/components/marketing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <PricingPreview />
      <Cta />
      <Footer />
    </div>
  );
}
