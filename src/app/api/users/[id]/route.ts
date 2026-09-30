import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { notifyUser } from "@/lib/services/notification";

const updateUserSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"]).optional(),
  role: z.enum(["ADMIN", "TECHNICIAN", "RESIDENT", "BUSINESS", "HOTSPOT_USER"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await apiRequireRole(ROLE_GROUPS.ADMIN_ONLY);
  if (gate instanceof NextResponse) return gate;

  if (id === gate.id) {
    return NextResponse.json({ error: "You can't change your own account here." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const user = await prisma.user.update({ where: { id }, data: parsed.data });

  if (parsed.data.status === "SUSPENDED") {
    await notifyUser({
      userId: user.id,
      title: "Account suspended",
      message: "Your NovaNet account has been suspended. Contact support for help.",
      type: "WARNING",
    });
  } else if (parsed.data.status === "ACTIVE") {
    await notifyUser({
      userId: user.id,
      title: "Account reactivated",
      message: "Your NovaNet account is active again. Welcome back!",
      type: "SUCCESS",
    });
  }

  return NextResponse.json({ user });
}
