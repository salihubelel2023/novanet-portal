import "server-only";

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Deliberately dependency-free: it throttles abusive bursts (credential
 * stuffing, mass signups, voucher-code brute forcing) without requiring an
 * external service. Caveat: on serverless hosting each instance keeps its
 * own counters, so this is best-effort rather than a global guarantee —
 * swap the store for Upstash Redis or similar if distributed limiting
 * becomes necessary.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanupAt = Date.now();

/** Drop expired buckets so the map cannot grow without bound. */
function cleanup(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  /** false when the caller exceeded `max` within the window. */
  ok: boolean;
  /** Seconds until the window resets (for Retry-After). */
  retryAfterSeconds: number;
};

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP. Vercel/proxies set x-forwarded-for; local dev
 * falls back to a shared "unknown" bucket, which is fine for testing.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
