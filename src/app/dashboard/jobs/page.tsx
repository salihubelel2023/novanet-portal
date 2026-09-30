import Link from "next/link";
import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Jobs" };

const STATUS_VARIANT: Record<string, "warning" | "sky" | "success" | "secondary"> = {
  ASSIGNED: "warning",
  IN_PROGRESS: "sky",
  COMPLETED: "success",
  CANCELLED: "secondary",
};

export default async function JobsPage() {
  const user = await requireRole(ROLE_GROUPS.STAFF);

  const jobs = await prisma.technicianJob.findMany({
    where: user.role === "ADMIN" ? {} : { technicianId: user.id },
    include: { customer: { select: { name: true } }, technician: { select: { name: true } }, estate: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Jobs" description={user.role === "ADMIN" ? "All field jobs across NovaNet." : "Your installation and repair queue."} />

      {jobs.length === 0 ? (
        <EmptyState icon={Wrench} title="No jobs" description="New installations and repairs will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Type</TableHead>
                  {user.role === "ADMIN" && <TableHead>Technician</TableHead>}
                  <TableHead>Customer</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={`/dashboard/jobs/${job.id}`} className="font-mono text-xs text-signal hover:underline">
                        {job.jobNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{job.type.charAt(0) + job.type.slice(1).toLowerCase()}</TableCell>
                    {user.role === "ADMIN" && <TableCell className="text-muted-foreground">{job.technician.name}</TableCell>}
                    <TableCell className="text-muted-foreground">{job.customer?.name ?? job.estate?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{job.scheduledAt ? formatDate(job.scheduledAt) : "Unscheduled"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[job.status]}>{job.status.replace("_", " ")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
