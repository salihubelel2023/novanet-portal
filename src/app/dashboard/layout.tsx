import { requireAuth } from "@/lib/rbac";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={user.role} />
      <div className="lg:pl-64">
        <Topbar role={user.role} name={user.name ?? "There"} email={user.email ?? ""} image={user.image} />
        <main className="container-page py-8">{children}</main>
      </div>
    </div>
  );
}
