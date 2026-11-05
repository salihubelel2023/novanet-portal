import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });
  const plan = await prisma.plan.update({
    where: { id: "cmvs7urbs0000rki6sr4fa06d" },
    data: { isActive: false },
    select: { id: true, name: true, isActive: true },
  });
  console.log("deactivated:", JSON.stringify(plan));
  await prisma.$disconnect();
}

main();
