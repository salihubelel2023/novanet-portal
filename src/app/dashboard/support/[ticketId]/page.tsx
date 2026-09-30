import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TicketReplyForm } from "@/components/forms/ticket-reply-form";
import { TicketAdminControls } from "@/components/forms/ticket-admin-controls";
import { TICKET_CATEGORY_LABELS } from "@/lib/constants";
import { formatDateTime, initials, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ticket" };

const STATUS_VARIANT: Record<string, "warning" | "sky" | "success" | "secondary"> = {
  OPEN: "warning",
  IN_PROGRESS: "sky",
  RESOLVED: "success",
  CLOSED: "secondary",
};

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const user = await requireAuth();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      messages: { include: { sender: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) notFound();
  const canView = user.role === "ADMIN" || ticket.userId === user.id || ticket.assignedToId === user.id;
  if (!canView) notFound();

  const technicians =
    user.role === "ADMIN"
      ? await prisma.user.findMany({ where: { role: "TECHNICIAN", status: "ACTIVE" }, select: { id: true, name: true } })
      : [];

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        description={`${ticket.ticketNumber} · ${TICKET_CATEGORY_LABELS[ticket.category]} · opened by ${ticket.user.name}`}
        actions={<Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{ticket.description}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {ticket.messages.map((msg) => {
              const isOwner = msg.senderId === ticket.userId;
              return (
                <div key={msg.id} className={cn("flex gap-3", !isOwner && "flex-row-reverse")}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>{initials(msg.sender.name)}</AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[80%] rounded-xl border border-border p-4", isOwner ? "bg-card" : "bg-signal/8")}>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold">{msg.sender.name}</p>
                      <span className="text-[11px] text-muted-foreground">{formatDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {ticket.status !== "CLOSED" && <TicketReplyForm ticketId={ticket.id} />}
        </div>

        <div className="space-y-4">
          {(user.role === "ADMIN" || user.role === "TECHNICIAN") && (
            <Card>
              <CardHeader>
                <CardTitle>Manage ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <TicketAdminControls
                  ticketId={ticket.id}
                  status={ticket.status}
                  priority={ticket.priority}
                  assignedToId={ticket.assignedToId}
                  technicians={technicians}
                  canAssign={user.role === "ADMIN"}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span>{ticket.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="truncate">{ticket.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned to</span>
                <span>{ticket.assignedTo?.name ?? "Unassigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opened</span>
                <span>{formatDateTime(ticket.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
