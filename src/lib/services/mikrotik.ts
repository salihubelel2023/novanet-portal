import "server-only";
import type { MikrotikHotspotActiveUser, MikrotikSystemResource } from "@/types";

/**
 * MikroTik RouterOS REST API client.
 *
 * RouterOS >= 7.1beta4 exposes a JSON REST wrapper over the console API at
 * https://<router-ip>/rest/<path> (enable the `www-ssl` service on the
 * router first). Verb mapping follows the console command it wraps:
 *   GET    /rest/<path>          → print (list/read)
 *   POST   /rest/<path>          → add   (create)
 *   PATCH  /rest/<path>/<id>     → set   (update one record)
 *   DELETE /rest/<path>/<id>     → remove
 * Auth is plain HTTP Basic (same credentials as the RouterOS console user).
 * Reference: https://help.mikrotik.com/docs/spaces/ROS/pages/47579162/REST+API
 *
 * This client is written for real hardware but degrades gracefully: every
 * call throws a typed MikrotikUnavailableError if the router isn't
 * configured or isn't reachable, so the dashboard can show a clear
 * "not connected" state instead of crashing.
 */

export class MikrotikUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MikrotikUnavailableError";
  }
}

type MikrotikConfig = {
  host: string;
  username: string;
  password: string;
  useSsl: boolean;
};

function loadConfig(): MikrotikConfig | null {
  const host = process.env.MIKROTIK_HOST;
  const username = process.env.MIKROTIK_USERNAME;
  const password = process.env.MIKROTIK_PASSWORD;
  if (!host || !username || !password) return null;
  return {
    host,
    username,
    password,
    useSsl: process.env.MIKROTIK_USE_SSL !== "false",
  };
}

export function isMikrotikConfigured(): boolean {
  return loadConfig() !== null;
}

class MikrotikClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: MikrotikConfig) {
    const scheme = config.useSsl ? "https" : "http";
    this.baseUrl = `${scheme}://${config.host}/rest`;
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`;
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      throw new MikrotikUnavailableError(
        `Could not reach MikroTik router at ${this.baseUrl}: ${(err as Error).message}`
      );
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new MikrotikUnavailableError(
        `MikroTik REST API error ${res.status} on ${method} ${path}: ${detail}`
      );
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  async getSystemResource(): Promise<MikrotikSystemResource> {
    const data = await this.request<Record<string, string>>("GET", "/system/resource");
    return {
      boardName: data["board-name"] ?? "Unknown",
      version: data["version"] ?? "Unknown",
      cpuLoad: Number(data["cpu-load"] ?? 0),
      uptime: data["uptime"] ?? "0s",
      freeMemoryBytes: Number(data["free-memory"] ?? 0),
      totalMemoryBytes: Number(data["total-memory"] ?? 0),
    };
  }

  async listActiveHotspotUsers(): Promise<MikrotikHotspotActiveUser[]> {
    const data = await this.request<Record<string, string>[]>("GET", "/ip/hotspot/active");
    return data.map((row) => ({
      id: row[".id"] ?? row["id"] ?? "",
      user: row["user"] ?? "",
      address: row["address"] ?? "",
      macAddress: row["mac-address"] ?? "",
      uptime: row["uptime"] ?? "0s",
      bytesIn: Number(row["bytes-in"] ?? 0),
      bytesOut: Number(row["bytes-out"] ?? 0),
    }));
  }

  async disconnectActiveUser(activeSessionId: string): Promise<void> {
    await this.request("DELETE", `/ip/hotspot/active/${encodeURIComponent(activeSessionId)}`);
  }

  /**
   * Provision (or re-provision) a RouterOS hotspot user so a redeemed
   * voucher can actually get the customer's device online. `name` doubles
   * as the RouterOS username; the voucher code is used for both username
   * and password, matching how scratch-card hotspot vouchers work in
   * practice.
   */
  async createHotspotUser(params: {
    name: string;
    password: string;
    profile?: string;
    limitUptime?: string; // RouterOS duration format, e.g. "1d", "3h"
    comment?: string;
  }): Promise<void> {
    await this.request("POST", "/ip/hotspot/user", {
      name: params.name,
      password: params.password,
      profile: params.profile ?? "default",
      "limit-uptime": params.limitUptime,
      comment: params.comment ?? "Created by NovaNet Portal",
    });
  }

  async disableHotspotUserByName(name: string): Promise<void> {
    const users = await this.request<Record<string, string>[]>(
      "GET",
      `/ip/hotspot/user?name=${encodeURIComponent(name)}`
    );
    const match = users[0];
    if (!match) return;
    await this.request("PATCH", `/ip/hotspot/user/${match[".id"]}`, { disabled: "yes" });
  }
}

export function getMikrotikClient(): MikrotikClient | null {
  const config = loadConfig();
  if (!config) return null;
  return new MikrotikClient(config);
}
