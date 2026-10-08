import "server-only";
import { prisma } from "@/lib/prisma";
import { generateVoucherCode } from "@/lib/utils";
import { getMikrotikClient } from "@/lib/services/mikrotik";
import { redeemVoucherRecord, type VoucherStore } from "@/lib/services/voucher-redeem";
import type { Plan } from "@prisma/client";

export { VoucherRedemptionError } from "@/lib/services/voucher-redeem";

/** Billing-cycle → hours, used to translate a hotspot Plan into a voucher duration. */
const CYCLE_TO_HOURS: Record<string, number> = {
  HOURLY: 1,
  DAILY: 24,
  WEEKLY: 24 * 7,
  MONTHLY: 24 * 30,
  QUARTERLY: 24 * 90,
  ANNUALLY: 24 * 365,
};

export function durationHoursForPlan(plan: Pick<Plan, "billingCycle" | "durationHours">): number {
  if (plan.durationHours && plan.durationHours > 0) return plan.durationHours;
  return CYCLE_TO_HOURS[plan.billingCycle] ?? 24;
}

/** Generate a batch of unique, unused vouchers for a hotspot plan. */
export async function generateVoucherBatch(params: {
  plan: Plan;
  quantity: number;
  batchName: string;
  generatedById: string;
}) {
  const { plan, quantity, batchName, generatedById } = params;
  const durationHours = durationHoursForPlan(plan);

  const batch = await prisma.voucherBatch.create({
    data: {
      name: batchName,
      quantity,
      planId: plan.id,
      generatedById,
    },
  });

  const codes = new Set<string>();
  while (codes.size < quantity) {
    codes.add(generateVoucherCode());
  }

  await prisma.hotspotVoucher.createMany({
    data: Array.from(codes).map((code) => ({
      code,
      batchId: batch.id,
      planId: plan.id,
      durationHours,
      dataCapMB: plan.dataCapGB ? plan.dataCapGB * 1024 : null,
      price: plan.price,
      generatedById,
      status: "UNUSED" as const,
    })),
  });

  return prisma.voucherBatch.findUniqueOrThrow({
    where: { id: batch.id },
    include: { vouchers: true, generatedBy: true },
  });
}

const prismaVoucherStore: VoucherStore<
  Awaited<ReturnType<typeof prisma.hotspotVoucher.findUniqueOrThrow>> & { plan: { name: string } }
> = {
  async findByCode(code) {
    return prisma.hotspotVoucher.findUnique({
      where: { code },
      include: { plan: true },
    });
  },
  async claimUnused(id, data) {
    // Conditional update is the lock: two concurrent redeems of the same
    // UNUSED code cannot both succeed, which the previous find-then-update
    // path allowed.
    const result = await prisma.hotspotVoucher.updateMany({
      where: { id, status: "UNUSED" },
      data: { ...data, status: "ACTIVE" },
    });
    return result.count === 1;
  },
  getById(id) {
    return prisma.hotspotVoucher.findUniqueOrThrow({
      where: { id },
      include: { plan: true },
    });
  },
};

/**
 * Redeem a voucher code: mark it active, set its expiry window, and
 * (best-effort) provision a matching RouterOS hotspot user so the
 * customer's device is actually let onto the network. MikroTik failures
 * are logged but don't block redemption — the voucher is still valid even
 * if the live router push has to be retried by an admin.
 */
export async function redeemVoucher(params: {
  code: string;
  userId?: string;
  deviceMac?: string;
}) {
  const updated = await redeemVoucherRecord(prismaVoucherStore, params);

  const mikrotik = getMikrotikClient();
  if (mikrotik) {
    try {
      await mikrotik.createHotspotUser({
        name: updated.code,
        password: updated.code,
        limitUptime: `${updated.durationHours}h`,
        comment: `Voucher ${updated.code} — ${updated.plan.name}`,
      });
    } catch (err) {
      // Non-fatal: the voucher redemption itself already succeeded.
      console.error("MikroTik hotspot user provisioning failed:", err);
    }
  }

  return updated;
}
