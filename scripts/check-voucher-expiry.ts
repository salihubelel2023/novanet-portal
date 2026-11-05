import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const CODES = ["NVN-8H75-X4S2", "NVN-ZFFC-E92C", "NVN-ENB3-W2H5"];

function effectiveStatus(row: { status: string; expiresAt: Date | null }): string {
  // Mirrors effectiveVoucherStatus() in src/lib/utils.ts: an ACTIVE voucher
  // whose expiry has passed displays as EXPIRED even before the cron sweep.
  if (row.status === "ACTIVE" && row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    return "EXPIRED (effective)";
  }
  return row.status;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter, log: ["error"] });

  console.log(`now: ${new Date().toISOString()}`);
  for (const code of CODES) {
    const v = await prisma.hotspotVoucher.findUnique({
      where: { code },
      select: {
        code: true,
        status: true,
        redeemedAt: true,
        expiresAt: true,
        plan: { select: { name: true } },
      },
    });
    if (!v) {
      console.log(`${code}: not found`);
      continue;
    }
    console.log(
      `${code}: db=${v.status}, effective=${effectiveStatus(v)}, redeemedAt=${v.redeemedAt?.toISOString() ?? "-"}, expiresAt=${v.expiresAt?.toISOString() ?? "-"} (${v.plan.name})`
    );
  }
  await prisma.$disconnect();
}

main();
