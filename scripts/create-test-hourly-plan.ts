import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Creates a temporary 1-hour hotspot plan for the voucher-expiry smoke test.
 * Printed id is used by the purchase flow; deactivate afterwards to restore
 * the live catalog.
 */
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });

  const plan = await prisma.plan.create({
    data: {
      name: "Hotspot Hourly (2 Mbps)",
      description: "1-hour hotspot pass (temporary test plan)",
      type: "HOTSPOT",
      price: 200,
      billingCycle: "HOURLY",
      speedMbps: 2,
      durationHours: 1,
      isActive: true,
      features: [],
    },
    select: { id: true, name: true, price: true, durationHours: true },
  });
  console.log(JSON.stringify(plan, null, 2));
  await prisma.$disconnect();
}

main();
