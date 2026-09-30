import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (last conflicting utility wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Nigerian Naira by default. NovaNet operates in
 * Nigeria, so every price/amount in the product should render as ₦ unless
 * a specific record's `currency` field says otherwise.
 */
export function formatCurrency(
  amount: number | string,
  currency: string = "NGN"
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "₦0.00";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Compact form for dashboard stat cards, e.g. ₦1.2M instead of ₦1,200,000.00 */
export function formatCurrencyCompact(amount: number | string, currency = "NGN"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((d.getTime() - Date.now()) / 1000);
  const divisions: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secondsInUnit] of divisions) {
    if (Math.abs(seconds) >= secondsInUnit || unit === "second") {
      return rtf.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return rtf.format(0, "second");
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Generate a human-typeable voucher code, e.g. NVN-7K4Q-X29B */
const VOUCHER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
export function generateVoucherCode(segments = 2, segmentLength = 4): string {
  const parts: string[] = [];
  for (let s = 0; s < segments; s++) {
    let part = "";
    for (let i = 0; i < segmentLength; i++) {
      part += VOUCHER_ALPHABET[Math.floor(Math.random() * VOUCHER_ALPHABET.length)];
    }
    parts.push(part);
  }
  return `NVN-${parts.join("-")}`;
}

export function generateReference(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function slugifyId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(5, "0")}`;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
