/**
 * TEMPORARY DEV ROUTE - DELETE BEFORE PRODUCTION DEPLOY
 *
 * GET /api/dev/mikrotik-test
 *
 * Verifies that the Next.js backend can reach the local MikroTik CHR at the
 * address configured in .env (MIKROTIK_HOST). It calls:
 *   1. /rest/system/identity  -> router name
 *   2. /rest/system/resource  -> CPU, RAM, uptime, version
 *   3. /rest/ip/hotspot/active -> active hotspot sessions (may be empty)
 *
 * Usage (while `npm run dev` is running):
 *   curl http://localhost:3000/api/dev/mikrotik-test
 */

import { NextResponse } from "next/server";
import { getMikrotikClient, MikrotikUnavailableError } from "@/lib/services/mikrotik";

export const runtime = "nodejs"; // needs Buffer for Basic-auth encoding

export async function GET() {
  const client = getMikrotikClient();

  if (!client) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "MikroTik client not configured. " +
          "Ensure MIKROTIK_HOST, MIKROTIK_USERNAME, and MIKROTIK_PASSWORD are set in .env.",
      },
      { status: 500 }
    );
  }

  try {
    const identity = await fetchIdentity();
    const resource = await client.getSystemResource();

    let activeUsers: unknown[] = [];
    let hotspotNote: string | undefined;
    try {
      activeUsers = await client.listActiveHotspotUsers();
    } catch (e) {
      // Hotspot may not be configured on a bare CHR — that is fine.
      hotspotNote =
        e instanceof MikrotikUnavailableError
          ? `Hotspot endpoint unavailable: ${e.message} (normal on a fresh CHR)`
          : String(e);
    }

    return NextResponse.json({
      ok: true,
      connection: {
        host: process.env.MIKROTIK_HOST,
        ssl: process.env.MIKROTIK_USE_SSL !== "false",
      },
      identity,
      systemResource: resource,
      activeHotspotUsers: activeUsers,
      ...(hotspotNote && { hotspotNote }),
    });
  } catch (err) {
    const message =
      err instanceof MikrotikUnavailableError ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

/**
 * Fetches /rest/system/identity directly.
 * The MikrotikClient helper does not expose this endpoint yet, so we call it
 * here using the same auth logic as the client constructor.
 */
async function fetchIdentity(): Promise<{ name: string }> {
  const host = process.env.MIKROTIK_HOST!;
  const username = process.env.MIKROTIK_USERNAME!;
  const password = process.env.MIKROTIK_PASSWORD!;
  const useSsl = process.env.MIKROTIK_USE_SSL !== "false";

  const scheme = useSsl ? "https" : "http";
  const url = `${scheme}://${host}/rest/system/identity`;
  const auth = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: auth },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    throw new MikrotikUnavailableError(
      `Could not reach identity endpoint at ${url}: ${(e as Error).message}`
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MikrotikUnavailableError(
      `Identity endpoint returned ${res.status}: ${body}`
    );
  }

  return (await res.json()) as { name: string };
}
