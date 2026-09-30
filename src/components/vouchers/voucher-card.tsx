"use client";

import { QRCodeSVG } from "qrcode.react";
import { Wifi, Clock, Database } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { formatCurrency } from "@/lib/utils";

export type VoucherCardData = {
  code: string;
  planName: string;
  durationHours: number;
  dataCapMB: number | null;
  price: number;
  status: "UNUSED" | "ACTIVE" | "USED" | "EXPIRED" | "DISABLED";
  expiresAt?: string | null;
};

const STATUS_VARIANT: Record<VoucherCardData["status"], "success" | "warning" | "secondary" | "danger"> = {
  UNUSED: "secondary",
  ACTIVE: "success",
  USED: "secondary",
  EXPIRED: "danger",
  DISABLED: "danger",
};

function formatDuration(hours: number) {
  if (hours < 24) return `${hours}h access`;
  if (hours % 24 === 0) return `${hours / 24}d access`;
  return `${hours}h access`;
}

export function VoucherCard({ voucher }: { voucher: VoucherCardData }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-dashed border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-signal/12 text-signal">
            <Wifi className="h-3.5 w-3.5" />
          </span>
          <span className="font-display text-sm font-semibold">NovaNet Hotspot</span>
        </div>
        <Badge variant={STATUS_VARIANT[voucher.status]}>{voucher.status}</Badge>
      </div>

      <div className="flex flex-col items-center gap-4 p-6 sm:flex-row">
        <div className="rounded-xl border border-border bg-white p-3">
          <QRCodeSVG value={voucher.code} size={104} bgColor="#ffffff" fgColor="#0a0d10" level="M" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Voucher code</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-wider">{voucher.code}</p>
          <p className="mt-1 text-sm text-muted-foreground">{voucher.planName}</p>

          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {formatDuration(voucher.durationHours)}
            </span>
            <span className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5" />
              {voucher.dataCapMB ? `${(voucher.dataCapMB / 1024).toFixed(1)} GB cap` : "Unlimited data"}
            </span>
            <span>{formatCurrency(voucher.price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
