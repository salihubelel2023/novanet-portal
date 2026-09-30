"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const STATUSES = ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export function JobStatusControl({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();

  async function update(next: string) {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      toast.error("Could not update job status.");
      return;
    }
    toast.success("Job updated.");
    router.refresh();
  }

  return (
    <Select defaultValue={status} onValueChange={update}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
