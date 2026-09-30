"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function send() {
    if (!message.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not send your reply.");
      return;
    }
    setMessage("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Write a reply…"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
      />
      <div className="flex justify-end">
        <Button onClick={send} loading={loading} disabled={!message.trim()}>
          <Send className="h-4 w-4" /> Send reply
        </Button>
      </div>
    </div>
  );
}
