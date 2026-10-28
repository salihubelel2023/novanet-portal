import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { VerificationBanner } from "@/components/dashboard/verification-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const phoneInfo = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true, phoneVerifiedAt: true },
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={user.role} />
      <div className="lg:pl-64">
        <Topbar role={user.role} name={user.name ?? "There"} email={user.email ?? ""} image={user.image} />
        <main className="container-page py-8">
          {phoneInfo && !phoneInfo.phoneVerifiedAt && (
            <VerificationBanner phone={phoneInfo.phone} />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
