import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireAuth, apiRequireRole } from "@/lib/rbac";
import { updateTicketSchema } from "@/lib/validations/ticket";
import { notifyUser } from "@/lib/services/notification";

async function loadTicketOrNull(id: string) {
  return prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      messages: { include: { sender: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const ticket = await loadTicketOrNull(id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const canView =
    gate.role === "ADMIN" || ticket.userId === gate.id || ticket.assignedToId === gate.id;
  if (!canView) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  return NextResponse.json({ ticket });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireRole(["ADMIN", "TECHNICIAN"]);
  if (gate instanceof NextResponse) return gate;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (gate.role === "TECHNICIAN" && ticket.assignedToId !== gate.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Only admins may (re)assign tickets.
  const data: Record<string, unknown> = {};
  if (parsed.data.status) {
    data.status = parsed.data.status;
    if (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED") data.resolvedAt = new Date();
  }
  if (parsed.data.priority) data.priority = parsed.data.priority;
  if (gate.role === "ADMIN" && parsed.data.assignedToId !== undefined) {
    data.assignedToId = parsed.data.assignedToId;
  }

  const updated = await prisma.supportTicket.update({ where: { id }, data });

  if (parsed.data.status) {
    await notifyUser({
      userId: ticket.userId,
      title: "Ticket updated",
      message: `${ticket.subject} is now ${parsed.data.status.toLowerCase().replace("_", " ")}.`,
      type: "TICKET",
      link: `/dashboard/support/${ticket.id}`,
    });
  }

  return NextResponse.json({ ticket: updated });
}
