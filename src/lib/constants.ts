import type { Role, TicketCategory, TicketPriority } from "@prisma/client";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "NovaNet Portal";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const COMPANY_LEGAL_NAME = "NovaNet Communications Ltd.";
export const COMPANY_ADDRESS = "Abuja, FCT, Nigeria";
export const SUPPORT_EMAIL = "salihubelel2023@gmail.com";
/** WhatsApp Business line — shown as a tap-to-chat link in the UI. */
export const WHATSAPP_NUMBER = "+2349132376668";
/** Voice/SMS support line — kept separate from WhatsApp since they differ. */
export const SUPPORT_PHONE = "+2349160578363";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, "")}`;

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  TECHNICIAN: "Technician",
  RESIDENT: "Resident",
  BUSINESS: "Business",
  HOTSPOT_USER: "Hotspot user",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Full control over plans, users, vouchers, network and support.",
  TECHNICIAN: "Installations, repairs and field diagnostics.",
  RESIDENT: "Home internet for an estate address.",
  BUSINESS: "Dedicated connectivity for a company or office.",
  HOTSPOT_USER: "Pay-as-you-go Wi-Fi with vouchers.",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  BILLING: "Billing",
  TECHNICAL: "Technical",
  INSTALLATION: "Installation",
  NETWORK: "Network",
  ACCOUNT: "Account",
  OTHER: "Other",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export const DEFAULT_PAGE_SIZE = 20;
