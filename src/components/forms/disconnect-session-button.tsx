"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DisconnectSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function disconnect() {
    setLoading(true);
    const res = await fetch(`/api/network/mikrotik/hotspot-users/${sessionId}`, { method: "PATCH" });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not disconnect this session.");
      return;
    }
    toast.success("Session disconnected.");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={disconnect} loading={loading} className="text-destructive hover:bg-destructive/10">
      <WifiOff className="h-3.5 w-3.5" /> Disconnect
    </Button>
  );
}
