import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { notifyRole } from "@/lib/services/notification";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone: data.phone }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email or phone already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      phone: data.phone,
      passwordHash,
      role: data.accountType,
      businessName: data.accountType === "BUSINESS" ? data.businessName : undefined,
      address: data.address,
      estateId: data.estateId || undefined,
    },
  });

  await notifyRole({
    role: "ADMIN",
    title: "New account created",
    message: `${user.name} signed up as a ${data.accountType.toLowerCase().replace("_", " ")}.`,
    type: "INFO",
    link: "/dashboard/users",
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
