export class VoucherRedemptionError extends Error {}

export type RedeemableVoucher = {
  id: string;
  code: string;
  status: string;
  durationHours: number;
  plan: { name: string };
};

export type VoucherClaimData = {
  redeemedById: string | undefined;
  redeemedAt: Date;
  activatedAt: Date;
  expiresAt: Date;
  deviceMac: string | undefined;
};

/**
 * Persistence surface used by redeemVoucherRecord. Production wires this
 * to Prisma; tests use an in-memory store so we can prove only one
 * concurrent redeem wins without standing up Postgres.
 */
export type VoucherStore<TRedeemed = RedeemableVoucher> = {
  findByCode(code: string): Promise<RedeemableVoucher | null>;
  /** Atomically claim an UNUSED voucher. Returns false if another caller already claimed it. */
  claimUnused(id: string, data: VoucherClaimData): Promise<boolean>;
  getById(id: string): Promise<TRedeemed>;
};

export function voucherExpiresAt(now: Date, durationHours: number): Date {
  return new Date(now.getTime() + durationHours * 60 * 60 * 1000);
}

export async function redeemVoucherRecord<TRedeemed>(
  store: VoucherStore<TRedeemed>,
  params: { code: string; userId?: string; deviceMac?: string },
  now: Date = new Date()
) {
  const voucher = await store.findByCode(params.code);

  if (!voucher) throw new VoucherRedemptionError("That voucher code was not found.");
  if (voucher.status === "USED" || voucher.status === "ACTIVE") {
    throw new VoucherRedemptionError("This voucher has already been redeemed.");
  }
  if (voucher.status === "EXPIRED" || voucher.status === "DISABLED") {
    throw new VoucherRedemptionError("This voucher is no longer valid.");
  }

  const claimed = await store.claimUnused(voucher.id, {
    redeemedById: params.userId,
    redeemedAt: now,
    activatedAt: now,
    expiresAt: voucherExpiresAt(now, voucher.durationHours),
    deviceMac: params.deviceMac,
  });

  if (!claimed) {
    throw new VoucherRedemptionError("This voucher has already been redeemed.");
  }

  return store.getById(voucher.id);
}
