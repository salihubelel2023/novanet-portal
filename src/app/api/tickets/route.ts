import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireAuth, ROLE_GROUPS } from "@/lib/rbac";
import { createTicketSchema } from "@/lib/validations/ticket";
import { notifyRole } from "@/lib/services/notification";
import { generateReference } from "@/lib/utils";

export async function GET() {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const where =
    gate.role === "ADMIN"
      ? {}
      : gate.role === "TECHNICIAN"
        ? { assignedToId: gate.id }
        : { userId: gate.id };

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: { user: { select: { name: true } }, assignedTo: { select: { name: true } }, _count: { select: { messages: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;
  if (!ROLE_GROUPS.EVERYONE.includes(gate.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: generateReference("TKT"),
      userId: gate.id,
      subject: parsed.data.subject,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
    },
  });

  await notifyRole({
    role: "ADMIN",
    title: "New support ticket",
    message: `${parsed.data.subject} (${ticket.ticketNumber})`,
    type: "TICKET",
    link: `/dashboard/support/${ticket.id}`,
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
