import type {
  Role,
  PlanType,
  DeviceStatus,
} from "@prisma/client";

export type NavItem = {
  label: string;
  href: string;
  icon: string; // lucide-react icon name, resolved by the Sidebar component
  roles: Role[];
  badgeKey?: "unreadNotifications" | "openTickets";
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type PlanTypeFilter = PlanType | "ALL";

export type DeviceHealthSummary = {
  total: number;
  online: number;
  offline: number;
  degraded: number;
};

export type MikrotikSystemResource = {
  boardName: string;
  version: string;
  cpuLoad: number;
  uptime: string;
  freeMemoryBytes: number;
  totalMemoryBytes: number;
};

export type MikrotikHotspotActiveUser = {
  id: string;
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
};

export type StarlinkTelemetrySnapshot = {
  serviceLineId: string;
  dishSerial: string;
  status: DeviceStatus;
  downlinkMbps: number;
  uplinkMbps: number;
  latencyMs: number;
  obstruction: number; // percentage 0-100
  simulated: boolean;
};
