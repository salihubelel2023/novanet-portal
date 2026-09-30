import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireAuth } from "@/lib/rbac";
import { replyTicketSchema } from "@/lib/validations/ticket";
import { notifyUser, notifyRole } from "@/lib/services/notification";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const canReply = gate.role === "ADMIN" || ticket.userId === gate.id || ticket.assignedToId === gate.id;
  if (!canReply) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = replyTicketSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });

  const message = await prisma.ticketMessage.create({
    data: { ticketId: id, senderId: gate.id, message: parsed.data.message },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  // Re-open a resolved ticket if the customer follows up.
  if (gate.id === ticket.userId && (ticket.status === "RESOLVED" || ticket.status === "CLOSED")) {
    await prisma.supportTicket.update({ where: { id }, data: { status: "OPEN" } });
  }

  if (gate.id === ticket.userId) {
    if (ticket.assignedToId) {
      await notifyUser({
        userId: ticket.assignedToId,
        title: "New reply on ticket",
        message: `${ticket.subject}`,
        type: "TICKET",
        link: `/dashboard/support/${id}`,
      });
    } else {
      await notifyRole({ role: "ADMIN", title: "New reply on ticket", message: ticket.subject, type: "TICKET", link: `/dashboard/support/${id}` });
    }
  } else {
    await notifyUser({
      userId: ticket.userId,
      title: "Support replied",
      message: `New reply on ${ticket.subject}`,
      type: "TICKET",
      link: `/dashboard/support/${id}`,
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}
