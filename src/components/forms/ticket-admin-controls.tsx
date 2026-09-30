"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/primitives";
import { TICKET_PRIORITY_LABELS } from "@/lib/constants";

type Technician = { id: string; name: string };

export function TicketAdminControls({
  ticketId,
  status,
  priority,
  assignedToId,
  technicians,
  canAssign,
}: {
  ticketId: string;
  status: string;
  priority: string;
  assignedToId: string | null;
  technicians: Technician[];
  canAssign: boolean;
}) {
  const router = useRouter();

  async function update(patch: Record<string, unknown>) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error("Could not update ticket.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select defaultValue={status} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select defaultValue={priority} onValueChange={(v) => update({ priority: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {canAssign && (
        <div className="space-y-1.5">
          <Label>Assigned technician</Label>
          <Select defaultValue={assignedToId ?? "unassigned"} onValueChange={(v) => update({ assignedToId: v === "unassigned" ? null : v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
