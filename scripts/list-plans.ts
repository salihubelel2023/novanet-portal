import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });
  const plans = await prisma.plan.findMany({
    orderBy: [{ type: "asc" }, { price: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      billingCycle: true,
      speedMbps: true,
      dataCapGB: true,
      deviceLimit: true,
      district: true,
      isActive: true,
      isPopular: true,
      _count: { select: { subscriptions: true, vouchers: true } },
    },
  });
  for (const p of plans) {
    console.log(
      `${p.type} | ${p.name} | ${p.price} NGN/${p.billingCycle} | ${p.speedMbps}Mbps | cap=${p.dataCapGB ?? "unl"} | devices=${p.deviceLimit ?? "-"} | district=${p.district ?? "-"} | active=${p.isActive} | popular=${p.isPopular} | subs=${p._count.subscriptions} vouchers=${p._count.vouchers}`
    );
  }
  await prisma.$disconnect();
}

main();
