import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRequireRole, ROLE_GROUPS } from "@/lib/rbac";
import { generateVouchersSchema } from "@/lib/validations/voucher";
import { generateVoucherBatch } from "@/lib/services/voucher";

export async function GET(req: Request) {
  const gate = await apiRequireRole(["ADMIN", "HOTSPOT_USER"]);
  if (gate instanceof NextResponse) return gate;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  if (gate.role === "ADMIN") {
    const vouchers = await prisma.hotspotVoucher.findMany({
      include: { plan: true, redeemedBy: { select: { name: true, email: true } }, batch: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ vouchers });
  }

  const vouchers = await prisma.hotspotVoucher.findMany({
    where: { redeemedById: gate.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ vouchers });
}

export async function POST(req: Request) {
  const gate = await apiRequireRole(ROLE_GROUPS.ADMIN_ONLY);
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = generateVouchersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || plan.type !== "HOTSPOT") {
    return NextResponse.json({ error: "Select a valid hotspot plan" }, { status: 400 });
  }

  const batch = await generateVoucherBatch({
    plan,
    quantity: parsed.data.quantity,
    batchName: parsed.data.batchName ?? `${plan.name} · ${new Date().toLocaleDateString("en-NG")}`,
    generatedById: gate.id,
  });

  return NextResponse.json({ batch }, { status: 201 });
}
