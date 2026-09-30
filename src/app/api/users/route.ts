import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";

export async function GET(req: Request) {
  const gate = await apiRequireRole(ROLE_GROUPS.ADMIN_ONLY);
  if (gate instanceof NextResponse) return gate;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const q = searchParams.get("q");

  const users = await prisma.user.findMany({
    where: {
      ...(role && role !== "ALL" ? { role: role as never } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      businessName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ users });
}
