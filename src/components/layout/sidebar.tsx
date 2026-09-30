import type { Role } from "@prisma/client";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface py-6 lg:flex">
      <SidebarNav role={role} />
    </aside>
  );
}
