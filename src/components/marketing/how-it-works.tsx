const STEPS = [
  {
    number: "01",
    title: "Choose your plan",
    description: "Resident, business or pay-as-you-go hotspot — sign up online in under five minutes.",
  },
  {
    number: "02",
    title: "We connect you",
    description: "A technician is dispatched, installs your line, and closes out the job in the portal.",
  },
  {
    number: "03",
    title: "Stay online, stay informed",
    description: "Track usage, pay bills, raise tickets and get notified — all from one dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-surface/50 py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">The process</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            From sign-up to signal in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              <span className="font-display text-5xl font-semibold text-signal/25">{step.number}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              {i < STEPS.length - 1 && (
                <div className="mt-8 hidden h-px w-full bg-gradient-to-r from-border to-transparent md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
