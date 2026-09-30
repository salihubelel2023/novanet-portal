import { z } from "zod";

export const generateVouchersSchema = z.object({
  planId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(500),
  batchName: z.string().min(2).optional(),
});
export type GenerateVouchersInput = z.infer<typeof generateVouchersSchema>;

export const redeemVoucherSchema = z.object({
  code: z
    .string()
    .min(4)
    .transform((v) => v.trim().toUpperCase()),
  deviceMac: z.string().optional(),
});
export type RedeemVoucherInput = z.infer<typeof redeemVoucherSchema>;

export const purchaseVoucherSchema = z.object({
  planId: z.string().min(1),
  provider: z.enum(["PAYSTACK", "FLUTTERWAVE"]),
});
export type PurchaseVoucherInput = z.infer<typeof purchaseVoucherSchema>;
