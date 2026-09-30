import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRequireAuth } from "@/lib/rbac";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, "Enter a valid Nigerian phone number")
    .optional(),
  address: z.string().optional(),
  businessName: z.string().optional(),
});

export async function GET() {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const user = await prisma.user.findUnique({
    where: { id: gate.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      businessName: true,
      role: true,
      image: true,
      createdAt: true,
      estate: { select: { name: true } },
    },
  });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (parsed.data.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: parsed.data.phone, NOT: { id: gate.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "That phone number is already in use." }, { status: 409 });
    }
  }

  const user = await prisma.user.update({ where: { id: gate.id }, data: parsed.data });
  return NextResponse.json({ user });
}
