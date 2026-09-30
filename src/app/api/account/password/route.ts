import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRequireAuth } from "@/lib/rbac";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export async function PATCH(req: Request) {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: gate.id } });
  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: gate.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
