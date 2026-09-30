import type { Metadata } from "next";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/primitives";
import { ProfileForm } from "@/components/forms/profile-form";
import { PasswordForm } from "@/components/forms/password-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const authUser = await requireAuth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: authUser.id },
    include: { estate: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and account preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>This information is used on invoices and support tickets.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                initial={{
                  name: user.name,
                  phone: user.phone ?? "",
                  address: user.address ?? "",
                  businessName: user.businessName ?? "",
                }}
                showBusinessName={user.role === "BUSINESS"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Choose a strong, unique password.</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>{ROLE_LABELS[user.role]}</span>
              </div>
              {user.estate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estate</span>
                  <span>{user.estate.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Appearance</span>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
