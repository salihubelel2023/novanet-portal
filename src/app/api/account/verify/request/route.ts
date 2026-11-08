import { NextResponse } from "next/server";
import { apiRequireAuth } from "@/lib/rbac";
import { issuePhoneVerificationCode, VerificationError } from "@/lib/services/verification";

export async function POST() {
  const gate = await apiRequireAuth();
  if (gate instanceof NextResponse) return gate;

  try {
    const issued = await issuePhoneVerificationCode(gate.id);
    return NextResponse.json({
      ok: true,
      expiresAt: issued.expiresAt.toISOString(),
      // Only present when TERMII_API_KEY is not configured (local dev).
      devCode: issued.devCode,
    });
  } catch (err) {
    if (err instanceof VerificationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
