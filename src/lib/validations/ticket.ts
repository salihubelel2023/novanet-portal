import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().min(5, "Give your issue a short title"),
  description: z.string().min(15, "Add a bit more detail so we can help faster"),
  category: z.enum(["BILLING", "TECHNICAL", "INSTALLATION", "NETWORK", "ACCOUNT", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const replyTicketSchema = z.object({
  message: z.string().min(1, "Write a reply before sending"),
});
export type ReplyTicketInput = z.infer<typeof replyTicketSchema>;

export const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  assignedToId: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
