import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const reference = process.argv[2] ?? "VCH-MVS49CMP-U01FAD";
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });

  const payment = await prisma.payment.findUnique({
    where: { reference },
    select: { status: true, paidAt: true, channel: true, amount: true, purpose: true },
  });
  console.log("payment:", JSON.stringify(payment));

  const voucher = await prisma.hotspotVoucher.findFirst({
    where: { payment: { reference } },
    select: { code: true, status: true, durationHours: true, price: true, plan: { select: { name: true } } },
  });
  console.log("voucher:", JSON.stringify(voucher));

  await prisma.$disconnect();
}

main();
