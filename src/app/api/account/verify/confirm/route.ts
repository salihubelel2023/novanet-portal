import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRequireAuth } from "@/lib/rbac";
import { verifyPhoneCode, VerificationError } from "@/lib/services/verification";

const confirmSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export async function POST(req: Request) {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid code" }, { status: 400 });
  }

  try {
    await verifyPhoneCode(gate.id, parsed.data.code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof VerificationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
