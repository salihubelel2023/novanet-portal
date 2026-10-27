import type { Metadata } from "next";
import { Radio, Satellite, Server, Activity, AlertTriangle, ShieldCheck, Cable } from "lucide-react";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getMikrotikClient, isMikrotikConfigured } from "@/lib/services/mikrotik";
import { getStarlinkTelemetry, starlinkIntegrationStatus } from "@/lib/services/starlink";
import { PageHeader, StatCard, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DisconnectSessionButton } from "@/components/forms/disconnect-session-button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Network" };

function bytesToGB(bytes: number) {
  return (bytes / 1024 ** 3).toFixed(1);
}

export default async function NetworkPage() {
  await requireRole(ROLE_GROUPS.STAFF);

  const devices = await prisma.networkDevice.findMany({ orderBy: { name: "asc" } });
  const starlinkDishes = devices.filter((d) => d.type === "STARLINK_DISH");

  const [mikrotikData, starlinkTelemetry] = await Promise.all([
    (async () => {
      if (!isMikrotikConfigured()) return { configured: false as const };
      const client = getMikrotikClient()!;
      try {
        const [resource, activeUsers] = await Promise.all([
          client.getSystemResource(),
          client.listActiveHotspotUsers(),
        ]);
        return { configured: true as const, reachable: true as const, resource, activeUsers };
      } catch (err) {
        return { configured: true as const, reachable: false as const, error: (err as Error).message };
      }
    })(),
    Promise.all(starlinkDishes.map((d) => getStarlinkTelemetry(d.id))),
  ]);

  const summary = {
    total: devices.length,
    online: devices.filter((d) => d.status === "ONLINE").length,
    offline: devices.filter((d) => d.status === "OFFLINE").length,
    degraded: devices.filter((d) => d.status === "DEGRADED").length,
  };

  return (
    <div>
      <PageHeader
        title="Network"
        description="Live monitoring for Phase3 Telecom primary fiber, MikroTik routing core, and Starlink fallback backhaul."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Devices" value={summary.total.toString()} icon={Server} accent="muted" />
        <StatCard label="Online" value={summary.online.toString()} icon={Activity} accent="signal" />
        <StatCard label="Degraded" value={summary.degraded.toString()} icon={AlertTriangle} accent="fiber" />
        <StatCard label="Offline" value={summary.offline.toString()} icon={Radio} accent="sky" />
      </div>

      {/* Dual-WAN Redundancy Overview */}
      <Card className="mt-6 border-signal/20 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-signal" /> Dual-WAN Redundancy & Uplink Architecture
            </CardTitle>
            <CardDescription>
              Automatic multi-WAN failover routed through the MikroTik core router.
            </CardDescription>
          </div>
          <Badge variant="success">Active Failover Enabled</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Primary WAN */}
            <div className="rounded-lg border border-signal/30 bg-signal/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cable className="h-4 w-4 text-signal" />
                  <p className="text-sm font-semibold text-foreground">WAN 1: Phase3 Telecom (Primary)</p>
                </div>
                <Badge variant="success">Active Link</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                High-capacity terrestrial metro fiber backhaul delivering ultra-low latency (&lt;15ms) across Abuja.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/50 pt-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Medium</p>
                  <p className="font-medium">Metro Fiber</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Priority</p>
                  <p className="font-medium text-signal">Route Metric 1</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target Latency</p>
                  <p className="font-medium text-signal">&lt; 15 ms</p>
                </div>
              </div>
            </div>

            {/* Fallback WAN */}
            <div className="rounded-lg border border-sky/30 bg-sky/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Satellite className="h-4 w-4 text-sky" />
                  <p className="text-sm font-semibold text-foreground">WAN 2: Starlink Satellite (Fallback)</p>
                </div>
                <Badge variant="secondary">Standby Failover</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Low Earth Orbit (LEO) satellite link configured for automatic standby failover if fiber maintenance or cuts occur.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/50 pt-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Medium</p>
                  <p className="font-medium">LEO Satellite</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Priority</p>
                  <p className="font-medium text-sky">Route Metric 2</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failover Mode</p>
                  <p className="font-medium text-sky">Auto Netwatch</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MikroTik */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-signal" /> MikroTik hotspot & gateway
            </CardTitle>
            <CardDescription>RouterOS REST API — core routing, dual-WAN failover, and active sessions.</CardDescription>
          </div>
          {mikrotikData.configured && "reachable" in mikrotikData && (
            <Badge variant={mikrotikData.reachable ? "success" : "danger"}>
              {mikrotikData.reachable ? "Connected" : "Unreachable"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {!mikrotikData.configured && (
            <EmptyState
              icon={Radio}
              title="MikroTik not configured"
              description="Set MIKROTIK_HOST, MIKROTIK_USERNAME and MIKROTIK_PASSWORD in .env to connect a real router."
            />
          )}

          {mikrotikData.configured && "reachable" in mikrotikData && !mikrotikData.reachable && (
            <EmptyState icon={AlertTriangle} title="Router unreachable" description={mikrotikData.error} />
          )}

          {mikrotikData.configured && "reachable" in mikrotikData && mikrotikData.reachable && (
            <div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">Board</p>
                  <p className="mt-1 text-sm font-medium">{mikrotikData.resource.boardName}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">RouterOS</p>
                  <p className="mt-1 text-sm font-medium">{mikrotikData.resource.version}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">CPU load</p>
                  <p className="mt-1 text-sm font-medium">{mikrotikData.resource.cpuLoad}%</p>
                </div>
              </div>

              <h4 className="mt-6 text-sm font-semibold">Active sessions</h4>
              {mikrotikData.activeUsers.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No devices currently connected.</p>
              ) : (
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Uptime</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mikrotikData.activeUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs">{u.user}</TableCell>
                        <TableCell className="text-muted-foreground">{u.address}</TableCell>
                        <TableCell className="text-muted-foreground">{u.uptime}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {bytesToGB(u.bytesIn + u.bytesOut)} GB
                        </TableCell>
                        <TableCell className="text-right">
                          <DisconnectSessionButton sessionId={u.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Starlink Fallback Backhaul */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-4 w-4 text-sky" /> Starlink — Secondary / Fallback Uplink
            </CardTitle>
            <CardDescription>
              Satellite telemetry for standby backhaul — automatically activated if Phase3 Telecom fiber encounters cuts or outages.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Standby Failover</Badge>
            <Badge variant={starlinkIntegrationStatus() === "live" ? "success" : "secondary"}>
              {starlinkIntegrationStatus() === "live" ? "Live data" : "Simulated data"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {starlinkDishes.length === 0 ? (
            <EmptyState
              icon={Satellite}
              title="No Starlink dishes registered"
              description="Add a network device of type Starlink dish to monitor it here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {starlinkDishes.map((dish, i) => {
                const t = starlinkTelemetry[i];
                if (!t) return null;
                return (
                  <div key={dish.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{dish.name}</p>
                      <Badge variant={t.status === "ONLINE" ? "success" : "warning"}>{t.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{dish.location ?? "Unknown location"}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Downlink</p>
                        <p className="font-medium text-foreground">{t.downlinkMbps} Mbps</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Uplink</p>
                        <p className="font-medium text-foreground">{t.uplinkMbps} Mbps</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Latency</p>
                        <p className="font-medium text-foreground">{t.latencyMs} ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Obstruction</p>
                        <p className="font-medium text-foreground">{t.obstruction}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All devices */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All network devices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {devices.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={Server} title="No devices registered" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.type.replace("_", " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{d.location ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.lastSeenAt ? formatDate(d.lastSeenAt) : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.status === "ONLINE" ? "success" : d.status === "DEGRADED" ? "warning" : "danger"}>
                        {d.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
