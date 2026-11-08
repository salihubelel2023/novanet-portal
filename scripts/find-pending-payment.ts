import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });
  const payment = await prisma.payment.findFirst({
    where: { userId: "cmvs4501w000206jmfx3qhem3", status: "PENDING", purpose: "VOUCHER" },
    select: { reference: true, amount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(JSON.stringify(payment));
  await prisma.$disconnect();
}

main();
