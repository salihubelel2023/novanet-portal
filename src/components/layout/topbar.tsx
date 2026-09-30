import type { Role } from "@prisma/client";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar({
  role,
  name,
  email,
  image,
}: {
  role: Role;
  name: string;
  email: string;
  image?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-2">
        <MobileNav role={role} />
      </div>
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <ThemeToggle />
        <UserMenu name={name} email={email} image={image} role={role} />
      </div>
    </header>
  );
}
