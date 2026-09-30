import { Gauge, Radio, Wallet, HeadphonesIcon, QrCode, Satellite } from "lucide-react";

const FEATURES = [
  {
    icon: Gauge,
    title: "Real subscription control",
    description: "Residents and businesses upgrade, renew or pause plans instantly — no calling in.",
  },
  {
    icon: QrCode,
    title: "QR hotspot vouchers",
    description: "Generate, print or sell scratch-style vouchers that redeem in seconds on any device.",
  },
  {
    icon: Wallet,
    title: "Paystack & Flutterwave",
    description: "Naira-first checkout with both major processors, reconciled automatically to invoices.",
  },
  {
    icon: Radio,
    title: "MikroTik-native",
    description: "Hotspot users, active sessions and router health, synced straight from RouterOS.",
  },
  {
    icon: Satellite,
    title: "Starlink-aware",
    description: "Bring satellite backhaul into the same monitoring view as your terrestrial gear.",
  },
  {
    icon: HeadphonesIcon,
    title: "Support that dispatches",
    description: "Tickets route to the right technician, with job status visible to the customer.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">Everything in one console</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for how Nigerian ISPs actually operate
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-signal/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal/12 text-signal transition-transform group-hover:scale-105">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
