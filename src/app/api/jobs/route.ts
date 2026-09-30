import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/services/notification";

const createJobSchema = z.object({
  type: z.enum(["INSTALLATION", "REPAIR", "MAINTENANCE", "INSPECTION"]),
  technicianId: z.string().min(1),
  userId: z.string().optional(),
  estateId: z.string().optional(),
  notes: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export async function GET() {
  const gate = await apiRequireRole(ROLE_GROUPS.STAFF);
  if (gate instanceof NextResponse) return gate;

  const where = gate.role === "ADMIN" ? {} : { technicianId: gate.id };
  const jobs = await prisma.technicianJob.findMany({
    where,
    include: { customer: { select: { name: true } }, technician: { select: { name: true } }, estate: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const gate = await apiRequireRole(ROLE_GROUPS.ADMIN_ONLY);
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const job = await prisma.technicianJob.create({
    data: {
      jobNumber: generateReference("JOB"),
      type: parsed.data.type,
      technicianId: parsed.data.technicianId,
      userId: parsed.data.userId,
      estateId: parsed.data.estateId,
      notes: parsed.data.notes,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    },
  });

  await notifyUser({
    userId: parsed.data.technicianId,
    title: "New job assigned",
    message: `${parsed.data.type} job ${job.jobNumber} has been assigned to you.`,
    type: "INFO",
    link: `/dashboard/jobs/${job.id}`,
  });

  return NextResponse.json({ job }, { status: 201 });
}
