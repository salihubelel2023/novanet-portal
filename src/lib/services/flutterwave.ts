import "server-only";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

function getSecretKey(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error("FLUTTERWAVE_SECRET_KEY is not configured");
  return key;
}

export type FlutterwaveInitializeParams = {
  email: string;
  name: string;
  phone?: string;
  /** Amount in Naira — unlike Paystack, Flutterwave takes the major unit directly. */
  amountNaira: number;
  txRef: string;
  redirectUrl: string;
  title?: string;
};

export type FlutterwaveInitializeResult = {
  paymentLink: string;
};

/** https://developer.flutterwave.com/v3.0/docs/flutterwave-standard-1 */
export async function flutterwaveInitializePayment(
  params: FlutterwaveInitializeParams
): Promise<FlutterwaveInitializeResult> {
  const res = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amountNaira.toString(),
      currency: "NGN",
      redirect_url: params.redirectUrl,
      customer: {
        email: params.email,
        name: params.name,
        phonenumber: params.phone,
      },
      customizations: {
        title: params.title ?? "NovaNet Portal",
      },
    }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || json.status !== "success") {
    throw new Error(json?.message ?? "Failed to initialize Flutterwave payment");
  }

  return { paymentLink: json.data.link };
}

export type FlutterwaveVerifyResult = {
  status: "successful" | "failed" | "pending";
  txRef: string;
  amountNaira: number;
  currency: string;
  paymentType: string | null;
  raw: unknown;
};

/** Verify by Flutterwave's numeric transaction id (returned on the redirect as transaction_id). */
export async function flutterwaveVerifyTransaction(
  transactionId: string
): Promise<FlutterwaveVerifyResult> {
  const res = await fetch(
    `${FLUTTERWAVE_BASE_URL}/transactions/${encodeURIComponent(transactionId)}/verify`,
    {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
      cache: "no-store",
    }
  );

  const json = await res.json();
  if (!res.ok || json.status !== "success") {
    throw new Error(json?.message ?? "Failed to verify Flutterwave transaction");
  }

  const data = json.data;
  const status: FlutterwaveVerifyResult["status"] =
    data.status === "successful" ? "successful" : data.status === "failed" ? "failed" : "pending";

  return {
    status,
    txRef: data.tx_ref,
    amountNaira: data.amount,
    currency: data.currency,
    paymentType: data.payment_type ?? null,
    raw: data,
  };
}

/**
 * Flutterwave webhooks are authenticated with a static shared secret you
 * configure once in Dashboard → Settings → Webhooks (not a per-request
 * HMAC digest like Paystack) — Flutterwave echoes that exact string back
 * in the `verif-hash` header, so this is a direct string comparison.
 * https://dev.to/flutterwaveeng/what-are-webhooks-and-how-do-you-implement-them-15j4
 */
export function verifyFlutterwaveWebhookSignature(signatureHeader: string | null): boolean {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash || !signatureHeader) return false;
  return signatureHeader === secretHash;
}
