import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });
  const phone = process.argv[2] ?? "08123456705";
  const payment = await prisma.payment.findFirst({
    where: { guestPhone: phone },
    orderBy: { createdAt: "desc" },
    select: { reference: true, status: true, guestEmail: true, metadata: true },
  });
  console.log(JSON.stringify(payment));
  await prisma.$disconnect();
}

main();
