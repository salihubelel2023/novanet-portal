import Link from "next/link";
import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TicketForm } from "@/components/forms/ticket-form";
import { TICKET_CATEGORY_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Support" };

const STATUS_VARIANT: Record<string, "warning" | "sky" | "success" | "secondary"> = {
  OPEN: "warning",
  IN_PROGRESS: "sky",
  RESOLVED: "success",
  CLOSED: "secondary",
};
const PRIORITY_VARIANT: Record<string, "secondary" | "warning" | "danger"> = {
  LOW: "secondary",
  MEDIUM: "secondary",
  HIGH: "warning",
  URGENT: "danger",
};

export default async function SupportPage() {
  const user = await requireAuth();

  const where =
    user.role === "ADMIN" ? {} : user.role === "TECHNICIAN" ? { assignedToId: user.id } : { userId: user.id };

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: { user: { select: { name: true } }, assignedTo: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Support"
        description={
          user.role === "ADMIN"
            ? "All customer tickets across NovaNet."
            : user.role === "TECHNICIAN"
              ? "Tickets assigned to you."
              : "Your support requests."
        }
        actions={user.role !== "TECHNICIAN" && user.role !== "ADMIN" ? <TicketForm /> : undefined}
      />

      {tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No tickets"
          description={user.role === "ADMIN" || user.role === "TECHNICIAN" ? "Nothing needs attention right now." : "Need help? Raise a ticket."}
          action={user.role !== "TECHNICIAN" && user.role !== "ADMIN" ? <TicketForm /> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  {(user.role === "ADMIN" || user.role === "TECHNICIAN") && <TableHead>Customer</TableHead>}
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/dashboard/support/${t.id}`} className="font-medium text-signal hover:underline">
                        {t.subject}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{t.ticketNumber}</p>
                    </TableCell>
                    {(user.role === "ADMIN" || user.role === "TECHNICIAN") && (
                      <TableCell className="text-muted-foreground">{t.user.name}</TableCell>
                    )}
                    <TableCell className="text-muted-foreground">{TICKET_CATEGORY_LABELS[t.category]}</TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeTime(t.updatedAt)}</TableCell>
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
