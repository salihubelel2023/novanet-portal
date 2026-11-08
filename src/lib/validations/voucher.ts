import { z } from "zod";

export const generateVouchersSchema = z.object({
  planId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(500),
  batchName: z.string().min(2).optional(),
});
export type GenerateVouchersInput = z.infer<typeof generateVouchersSchema>;
export type GenerateVouchersFormValues = z.input<typeof generateVouchersSchema>;

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

/** Guest (no-account) voucher purchase: same payment flow, contact details collected up front. */
export const guestPurchaseSchema = z.object({
  planId: z.string().min(1),
  provider: z.enum(["PAYSTACK", "FLUTTERWAVE"]),
  phone: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, "Enter a valid Nigerian phone number"),
  email: z.email({ message: "Enter a valid email address" }),
});
export type GuestPurchaseInput = z.infer<typeof guestPurchaseSchema>;
