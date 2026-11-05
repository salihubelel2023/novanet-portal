import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });
  const payments = await prisma.payment.findMany({
    where: { userId: "cmvs4501w000206jmfx3qhem3" },
    select: { id: true, reference: true, amount: true, status: true, provider: true, createdAt: true, purpose: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(JSON.stringify(payments, null, 2));
  await prisma.$disconnect();
}

main();
