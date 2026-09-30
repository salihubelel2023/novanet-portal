import { z } from "zod";

export const createSubscriptionSchema = z.object({
  planId: z.string().min(1),
  provider: z.enum(["PAYSTACK", "FLUTTERWAVE"]),
});
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z.object({
  action: z.enum(["CANCEL", "RENEW", "TOGGLE_AUTO_RENEW"]),
});
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const planSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  type: z.enum(["RESIDENTIAL", "BUSINESS", "HOTSPOT"]),
  price: z.coerce.number().positive(),
  billingCycle: z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"]),
  dataCapGB: z.coerce.number().int().positive().optional().nullable(),
  speedMbps: z.coerce.number().int().positive(),
  deviceLimit: z.coerce.number().int().positive().optional().nullable(),
  durationHours: z.coerce.number().int().positive().optional().nullable(),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
});
export type PlanInput = z.infer<typeof planSchema>;
