import "server-only";
import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

export type PaystackInitializeParams = {
  email: string;
  /** Amount in Naira (major unit) — this service converts to kobo for you. */
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export type PaystackInitializeResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

/**
 * Initialize a Paystack transaction. Paystack expects amounts in the
 * smallest currency subunit — for NGN that's kobo, so we multiply by 100.
 * https://paystack.com/docs/api/transaction/#initialize
 */
export async function paystackInitializeTransaction(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResult> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100),
      currency: "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json?.message ?? "Failed to initialize Paystack transaction");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export type PaystackVerifyResult = {
  status: "success" | "failed" | "abandoned" | "pending";
  reference: string;
  amountNaira: number;
  currency: string;
  channel: string | null;
  paidAt: string | null;
  raw: unknown;
};

/** https://paystack.com/docs/api/transaction/#verify */
export async function paystackVerifyTransaction(
  reference: string
): Promise<PaystackVerifyResult> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
      cache: "no-store",
    }
  );

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json?.message ?? "Failed to verify Paystack transaction");
  }

  const data = json.data;
  const status: PaystackVerifyResult["status"] =
    data.status === "success"
      ? "success"
      : data.status === "abandoned"
        ? "abandoned"
        : data.status === "failed"
          ? "failed"
          : "pending";

  return {
    status,
    reference: data.reference,
    amountNaira: data.amount / 100,
    currency: data.currency,
    channel: data.channel ?? null,
    paidAt: data.paid_at ?? null,
    raw: data,
  };
}

/**
 * Verify the `x-paystack-signature` header against an HMAC-SHA512 digest
 * of the *raw* request body, signed with the secret key. Must be run on
 * the raw bytes/string, not a re-serialized JSON.parse(...) round trip,
 * or the digest won't match.
 * https://paystack.com/docs/payments/webhooks/
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac("sha512", getSecretKey())
    .update(rawBody)
    .digest("hex");
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
