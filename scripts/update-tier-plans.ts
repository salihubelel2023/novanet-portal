import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * One-off data migration: align the three universal tiers with the MTN
 * FibreX style ladder (speed + price), and set the Daily hotspot voucher
 * to 3 devices.
 *
 * FibreX reference (mtn.ng): Basic 50Mbps N30,000, Standard 100Mbps
 * N45,000, Advanced 200Mbps N70,000. Device counts are ours: 10 / 20 / 40.
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
      speedMbps: 50,
      deviceLimit: 10,
      features: ["Up to 10 connected devices", "Unlimited data", "Free installation", "Standard support"],
    },
    {
      name: "Standard",
      description: "High speed urban fiber for busy households and home offices.",
      price: 45000,
      speedMbps: 100,
      deviceLimit: 20,
      features: ["Up to 20 connected devices", "Unlimited data", "Free installation", "Priority support"],
    },
    {
      name: "Premium",
      description: "Top tier speeds for smart homes and power users.",
      price: 70000,
      speedMbps: 200,
      deviceLimit: 40,
      features: ["Up to 40 connected devices", "Unlimited data", "Dedicated access point", "24/7 VIP priority support"],
    },
  ];

  for (const t of tiers) {
    const updated = await prisma.plan.updateMany({
      where: { name: t.name, type: "RESIDENTIAL", isActive: true },
      data: {
        price: t.price,
        speedMbps: t.speedMbps,
        deviceLimit: t.deviceLimit,
        description: t.description,
        features: t.features,
      },
    });
    console.log(`${t.name}: ${t.speedMbps}Mbps @ ${t.price} NGN, ${t.deviceLimit} devices (${updated.count} row(s))`);
  }

  const daily = await prisma.plan.updateMany({
    where: { name: "Hotspot Daily (5 Mbps)", type: "HOTSPOT" },
    data: { deviceLimit: 3 },
  });
  console.log(`Hotspot Daily: deviceLimit=3 (${daily.count} row(s))`);

  const summary = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { price: "asc" }],
    select: { name: true, type: true, price: true, speedMbps: true, deviceLimit: true },
  });
  console.log("--- active plans ---");
  for (const p of summary) {
    console.log(`${p.type} | ${p.name} | ${p.price} NGN | ${p.speedMbps}Mbps | devices=${p.deviceLimit ?? "-"}`);
  }

  await prisma.$disconnect();
}

main();
