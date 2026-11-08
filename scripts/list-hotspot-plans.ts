import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });
  const plans = await prisma.plan.findMany({
    where: { type: "HOTSPOT", isActive: true },
    select: { id: true, name: true, price: true, speedMbps: true },
    orderBy: { price: "asc" },
  });
  console.log(JSON.stringify(plans, null, 2));
  console.log("total plans (any type):", await prisma.plan.count());
  await prisma.$disconnect();
}

main();
