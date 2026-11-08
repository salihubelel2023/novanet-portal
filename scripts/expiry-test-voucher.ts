import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TEST_USER = "cmvs4501w000206jmfx3qhem3";
const PLAN_ID = "cmvbt1lwu0007bsi6qr9u96ty"; // Hotspot Daily

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });
  const cmd = process.argv[2];

  if (cmd === "create") {
    const v = await prisma.hotspotVoucher.create({
      data: {
        code: "NVN-EXPIRY-TEST",
        planId: PLAN_ID,
        durationHours: 1,
        price: 500,
        status: "ACTIVE",
        redeemedById: TEST_USER,
        activatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // expired 1h ago
      },
      select: { id: true, code: true, status: true, expiresAt: true },
    });
    console.log("created:", JSON.stringify(v));
  } else if (cmd === "delete") {
    const v = await prisma.hotspotVoucher.deleteMany({ where: { code: "NVN-EXPIRY-TEST" } });
    console.log("deleted:", JSON.stringify(v));
  } else {
    console.error("usage: tsx scripts/expiry-test-voucher.ts <create|delete>");
    process.exit(1);
  }
  await prisma.$disconnect();
}

main();
