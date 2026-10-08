import assert from "node:assert/strict";
import { test } from "node:test";
import {
  redeemVoucherRecord,
  voucherExpiresAt,
  VoucherRedemptionError,
  type RedeemableVoucher,
  type VoucherClaimData,
  type VoucherStore,
} from "./voucher-redeem";

function unusedVoucher(overrides: Partial<RedeemableVoucher> = {}): RedeemableVoucher {
  return {
    id: "voucher-1",
    code: "NVN-7K4Q-X29B",
    status: "UNUSED",
    durationHours: 24,
    plan: { name: "Hotspot Daily" },
    ...overrides,
  };
}

type StoredVoucher = RedeemableVoucher & Partial<VoucherClaimData>;

function memoryStore(initial: RedeemableVoucher): VoucherStore<StoredVoucher> & { claimedBy: string | undefined } {
  let row: StoredVoucher = { ...initial };
  const store: VoucherStore<StoredVoucher> & { claimedBy: string | undefined } = {
    claimedBy: undefined,
    async findByCode(code) {
      return row.code === code ? { ...row } : null;
    },
    async claimUnused(id, data) {
      if (row.id !== id || row.status !== "UNUSED") return false;
      row = { ...row, ...data, status: "ACTIVE" };
      store.claimedBy = data.redeemedById;
      return true;
    },
    async getById(id) {
      if (row.id !== id) throw new Error("not found");
      return row;
    },
  };
  return store;
}

test("sets expiry from durationHours when a unique claim succeeds", async () => {
  const now = new Date("2026-10-08T10:00:00.000Z");
  const store = memoryStore(unusedVoucher());
  const result = await redeemVoucherRecord(store, { code: "NVN-7K4Q-X29B", userId: "user-a" }, now);

  assert.equal(result.status, "ACTIVE");
  assert.equal(result.redeemedById, "user-a");
  assert.deepEqual(result.expiresAt, voucherExpiresAt(now, 24));
});

test("rejects a second concurrent redeem of the same UNUSED voucher", async () => {
  const store = memoryStore(unusedVoucher());
  const now = new Date("2026-10-08T10:00:00.000Z");

  const attempts = await Promise.allSettled([
    redeemVoucherRecord(store, { code: "NVN-7K4Q-X29B", userId: "user-a" }, now),
    redeemVoucherRecord(store, { code: "NVN-7K4Q-X29B", userId: "user-b" }, now),
  ]);

  const fulfilled = attempts.filter((r) => r.status === "fulfilled");
  const rejected = attempts.filter((r) => r.status === "rejected");

  assert.equal(fulfilled.length, 1, "exactly one redeem must succeed");
  assert.equal(rejected.length, 1, "the loser must fail");
  assert.ok(store.claimedBy === "user-a" || store.claimedBy === "user-b");
  assert.ok(rejected[0]?.status === "rejected" && rejected[0].reason instanceof VoucherRedemptionError);
  assert.equal(
    (rejected[0] as PromiseRejectedResult).reason.message,
    "This voucher has already been redeemed."
  );
});

test("does not claim expired or disabled vouchers", async () => {
  await assert.rejects(
    () => redeemVoucherRecord(memoryStore(unusedVoucher({ status: "EXPIRED" })), { code: "NVN-7K4Q-X29B" }),
    (err: unknown) => err instanceof VoucherRedemptionError && err.message === "This voucher is no longer valid."
  );
});
