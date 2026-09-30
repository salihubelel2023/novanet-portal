import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "LayoutDashboard", roles: ["ADMIN", "TECHNICIAN", "RESIDENT", "BUSINESS", "HOTSPOT_USER"] },
  { label: "Subscription", href: "/dashboard/subscriptions", icon: "Repeat", roles: ["RESIDENT", "BUSINESS"] },
  { label: "Vouchers", href: "/dashboard/vouchers", icon: "Ticket", roles: ["HOTSPOT_USER", "ADMIN"] },
  { label: "Billing", href: "/dashboard/billing", icon: "Receipt", roles: ["RESIDENT", "BUSINESS", "HOTSPOT_USER"] },
  { label: "Jobs", href: "/dashboard/jobs", icon: "Wrench", roles: ["TECHNICIAN"] },
  { label: "Network", href: "/dashboard/network", icon: "Radio", roles: ["ADMIN", "TECHNICIAN"] },
  { label: "Support", href: "/dashboard/support", icon: "LifeBuoy", roles: ["ADMIN", "TECHNICIAN", "RESIDENT", "BUSINESS", "HOTSPOT_USER"], badgeKey: "openTickets" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "BarChart3", roles: ["ADMIN"] },
  { label: "Users", href: "/dashboard/users", icon: "Users", roles: ["ADMIN"] },
  { label: "Plans", href: "/dashboard/plans", icon: "LayoutGrid", roles: ["ADMIN"] },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/dashboard/settings",
  icon: "Settings",
  roles: ["ADMIN", "TECHNICIAN", "RESIDENT", "BUSINESS", "HOTSPOT_USER"],
};
