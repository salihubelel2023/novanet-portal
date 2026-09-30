import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { JobStatusControl } from "@/components/forms/job-status-control";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Job detail" };

const STATUS_VARIANT: Record<string, "warning" | "sky" | "success" | "secondary"> = {
  ASSIGNED: "warning",
  IN_PROGRESS: "sky",
  COMPLETED: "success",
  CANCELLED: "secondary",
};

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireRole(ROLE_GROUPS.STAFF);

  const job = await prisma.technicianJob.findUnique({
    where: { id: jobId },
    include: {
      customer: { select: { name: true, email: true, phone: true, address: true } },
      technician: { select: { name: true } },
      estate: true,
      device: true,
    },
  });

  if (!job) notFound();
  if (user.role === "TECHNICIAN" && job.technicianId !== user.id) notFound();

  return (
    <div>
      <PageHeader
        title={`${job.type.charAt(0) + job.type.slice(1).toLowerCase()} · ${job.jobNumber}`}
        description={job.estate?.name ?? "No estate linked"}
        actions={<Badge variant={STATUS_VARIANT[job.status]}>{job.status.replace("_", " ")}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{job.notes || "No notes provided."}</p>
            </CardContent>
          </Card>

          {job.device && (
            <Card>
              <CardHeader>
                <CardTitle>Related device</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {job.device.name} · {job.device.type.replace("_", " ")}
                {job.device.location && ` · ${job.device.location}`}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <JobStatusControl jobId={job.id} status={job.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Technician</span>
                <span>{job.technician.name}</span>
              </div>
              {job.customer && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span>{job.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{job.customer.phone ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="text-right">{job.customer.address ?? "—"}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled</span>
                <span>{job.scheduledAt ? formatDateTime(job.scheduledAt) : "Unscheduled"}</span>
              </div>
              {job.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{formatDateTime(job.completedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
