import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      startDate: true,
      endDate: true,
      autoRenew: true,
      createdAt: true,
      user: { select: { email: true, role: true } },
      plan: { select: { name: true, price: true, isActive: true } },
    },
  });
  console.log(`now: ${new Date().toISOString()}`);
  for (const s of subs) {
    const expired = s.endDate ? s.endDate.getTime() < Date.now() : false;
    console.log(
      `${s.user.email} (${s.user.role}) | ${s.plan.name} | status=${s.status}${expired ? " (endDate passed)" : ""} | end=${s.endDate?.toISOString() ?? "-"} | autoRenew=${s.autoRenew} | planActive=${s.plan.isActive}`
    );
  }
  await prisma.$disconnect();
}

main();
