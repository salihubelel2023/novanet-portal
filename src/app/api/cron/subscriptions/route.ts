import { NextResponse } from "next/server";
import { processSubscriptionLifecycle } from "@/lib/services/subscription-lifecycle";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  
  // If CRON_SECRET is configured, require a match
  if (secret) {
    const authHeader = req.headers.get("authorization");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    return bearerToken === secret || cronSecretHeader === secret;
  }

  // Allow in development without secret for testing convenience
  return process.env.NODE_ENV !== "production";
}

async function handleLifecycleSweep(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET authorization." },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  try {
    const result = await processSubscriptionLifecycle();
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      durationMs,
      ...result,
    });
  } catch (err) {
    console.error("[Cron Lifecycle Handler] Unexpected failure:", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message ?? "Internal error processing subscription lifecycle",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleLifecycleSweep(req);
}

export async function POST(req: Request) {
  return handleLifecycleSweep(req);
}
