import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";

const updateJobSchema = z.object({
  status: z.enum(["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireRole(ROLE_GROUPS.STAFF);
  if (gate instanceof NextResponse) return gate;

  const job = await prisma.technicianJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (gate.role === "TECHNICIAN" && job.technicianId !== gate.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "COMPLETED") data.completedAt = new Date();

  const updated = await prisma.technicianJob.update({ where: { id }, data });
  return NextResponse.json({ job: updated });
}
