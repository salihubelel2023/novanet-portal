import "server-only";
import type { StarlinkTelemetrySnapshot } from "@/types";

/**
 * Starlink network monitoring — PLACEHOLDER INTEGRATION.
 *
 * Starlink exposes a real Management API and Telemetry API, but both
 * require a Starlink Reseller/Enterprise account with an assigned account
 * manager, OAuth2 client-credentials access (a client ID + secret created
 * under Settings → Service Accounts on starlink.com), and a specific
 * `service line` id per dish being monitored. That account relationship
 * is outside what can be provisioned/tested from this build, so this
 * service is written against the documented shape of that integration —
 * OAuth2 token exchange, then authenticated calls to the telemetry
 * endpoint — but returns clearly-labeled simulated data until real
 * credentials are supplied.
 *
 * To go live: fill in STARLINK_CLIENT_ID / STARLINK_CLIENT_SECRET /
 * STARLINK_ACCOUNT_NUMBER in .env, and swap SIMULATED_ENDPOINT usage below
 * for the real endpoints documented at https://starlink.readme.io/docs/telemetry-api
 * once your account manager grants API access.
 */

const STARLINK_AUTH_URL = "https://www.starlink.com/api/auth/connect/token";
const STARLINK_API_BASE = "https://web-api.starlink.com/enterprise";

function isStarlinkConfigured(): boolean {
  return Boolean(
    process.env.STARLINK_CLIENT_ID &&
      process.env.STARLINK_CLIENT_SECRET &&
      process.env.STARLINK_ACCOUNT_NUMBER
  );
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const res = await fetch(STARLINK_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.STARLINK_CLIENT_ID!,
      client_secret: process.env.STARLINK_CLIENT_SECRET!,
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Starlink OAuth token request failed (${res.status})`);
  const json = await res.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

/** Deterministic-ish pseudo-random telemetry so the UI looks alive across refreshes without a real dish. */
function simulateSnapshot(serviceLineId: string): StarlinkTelemetrySnapshot {
  const jitter = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 10) / 10;
  const obstruction = Math.random() < 0.85 ? jitter(0, 2) : jitter(2, 9);
  return {
    serviceLineId,
    dishSerial: `SIM-${serviceLineId.slice(-6).toUpperCase()}`,
    status: obstruction > 6 ? "DEGRADED" : "ONLINE",
    downlinkMbps: jitter(80, 220),
    uplinkMbps: jitter(10, 25),
    latencyMs: Math.round(jitter(25, 55)),
    obstruction,
    simulated: true,
  };
}

export async function getStarlinkTelemetry(
  serviceLineId: string
): Promise<StarlinkTelemetrySnapshot> {
  if (!isStarlinkConfigured()) {
    return simulateSnapshot(serviceLineId);
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(
      `${STARLINK_API_BASE}/user-terminals/${encodeURIComponent(serviceLineId)}/telemetry`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) throw new Error(`Starlink telemetry request failed (${res.status})`);
    const data = await res.json();

    // Field names here are illustrative of the documented Telemetry API
    // shape — confirm exact keys against your account's schema once live.
    return {
      serviceLineId,
      dishSerial: data.dishSerialNumber ?? "unknown",
      status: data.status === "ONLINE" ? "ONLINE" : "DEGRADED",
      downlinkMbps: data.downlinkThroughputMbps ?? 0,
      uplinkMbps: data.uplinkThroughputMbps ?? 0,
      latencyMs: data.pingLatencyMs ?? 0,
      obstruction: data.obstructionPercent ?? 0,
      simulated: false,
    };
  } catch {
    // Fail soft into simulated data rather than breaking the dashboard —
    // a transient Starlink API hiccup shouldn't take down network monitoring.
    return simulateSnapshot(serviceLineId);
  }
}

export function starlinkIntegrationStatus(): "live" | "simulated" {
  return isStarlinkConfigured() ? "live" : "simulated";
}
