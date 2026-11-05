import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * One-off data migration: move from district-based pricing to three
 * universal tiers.
 *
 * - Creates Basic / Standard / Premium (RESIDENTIAL, monthly) if missing.
 * - Deactivates (never deletes) all district-tagged residential/business
 *   plans so existing subscriptions keep working and the rows stay around
 *   for the future marketplace feature.
 * - Sets hotspot voucher device limits: Hourly 1, Daily 5, Weekly 5,
 *   Monthly 7 (enforced on the router via shared-users at redeem time).
 *
 * Idempotent: safe to re-run.
 */
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });

  const tiers = [
    {
      name: "Basic",
      description: "Reliable fiber for everyday home use, one simple price.",
      price: 30000,
      speedMbps: 35,
      deviceLimit: 10,
      features: ["Up to 10 connected devices", "Unlimited data", "Free installation", "Standard support"],
      isPopular: false,
    },
    {
      name: "Standard",
      description: "High-speed urban fiber for busy households and home offices.",
      price: 45000,
      speedMbps: 60,
      deviceLimit: 15,
      features: ["Up to 15 connected devices", "Unlimited data", "Free installation", "Priority support"],
      isPopular: true,
    },
    {
      name: "Premium",
      description: "Top-tier speeds for smart homes and power users.",
      price: 60000,
      speedMbps: 100,
      deviceLimit: 30,
      features: ["Up to 30 connected devices", "Unlimited data", "Dedicated access point", "24/7 VIP priority support"],
      isPopular: false,
    },
  ];

  for (const t of tiers) {
    const existing = await prisma.plan.findFirst({ where: { name: t.name, type: "RESIDENTIAL" } });
    if (existing) {
      console.log(`plan exists: ${t.name} (${existing.id})`);
      continue;
    }
    const created = await prisma.plan.create({
      data: {
        name: t.name,
        description: t.description,
        type: "RESIDENTIAL",
        price: t.price,
        billingCycle: "MONTHLY",
        speedMbps: t.speedMbps,
        deviceLimit: t.deviceLimit,
        dataCapGB: null,
        features: t.features,
        isActive: true,
        isPopular: t.isPopular,
      },
    });
    console.log(`created tier: ${t.name} (${created.id}) at ${t.price} NGN/month`);
  }

  const oldPlans = await prisma.plan.updateMany({
    where: { type: { in: ["RESIDENTIAL", "BUSINESS"] }, district: { not: null } },
    data: { isActive: false },
  });
  console.log(`deactivated district plans: ${oldPlans.count}`);

  const hotspotLimits: Record<string, number> = {
    "Hotspot Hourly (2 Mbps)": 1,
    "Hotspot Daily (5 Mbps)": 5,
    "Hotspot Weekly (10 Mbps)": 5,
    "Hotspot Monthly (25 Mbps)": 7,
  };
  for (const [name, limit] of Object.entries(hotspotLimits)) {
    const updated = await prisma.plan.updateMany({
      where: { name, type: "HOTSPOT" },
      data: { deviceLimit: limit },
    });
    console.log(`hotspot ${name}: deviceLimit=${limit} (${updated.count} row(s))`);
  }

  const summary = await prisma.plan.findMany({
    orderBy: [{ type: "asc" }, { price: "asc" }],
    select: { name: true, type: true, price: true, isActive: true, deviceLimit: true, district: true },
  });
  console.log("--- final state ---");
  for (const p of summary) {
    console.log(
      `${p.type} | ${p.name} | ${p.price} | active=${p.isActive} | devices=${p.deviceLimit ?? "-"} | district=${p.district ?? "-"}`
    );
  }

  await prisma.$disconnect();
}

main();
