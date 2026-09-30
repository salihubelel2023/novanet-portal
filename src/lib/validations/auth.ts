import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const basePassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z
  .object({
    accountType: z.enum(["RESIDENT", "BUSINESS", "HOTSPOT_USER"]),
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .regex(/^(\+234|0)[789]\d{9}$/, "Enter a valid Nigerian phone number"),
    password: basePassword,
    confirmPassword: z.string(),
    businessName: z.string().optional(),
    address: z.string().optional(),
    estateId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.accountType !== "BUSINESS" || !!data.businessName?.trim(), {
    message: "Business name is required",
    path: ["businessName"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;
