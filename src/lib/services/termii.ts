import "server-only";

const TERMII_BASE_URL = "https://api.ng.termii.com/api/sms/send";

/**
 * Normalize a Nigerian phone number to the international format Termii
 * expects (e.g. 08123456789 -> 2348123456789, +234... -> 234...).
 */
export function toTermiiMsisdn(phone: string): string {
  const digits = phone.replace(/[\s()+-]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

/**
 * Send an SMS through Termii. When TERMII_API_KEY is not configured
 * (local development), the message is logged instead of failing the
 * calling flow — verification still works end to end.
 */
export async function sendSms(phone: string, message: string): Promise<{ delivered: boolean }> {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID ?? "NovaNet";

  if (!apiKey) {
    console.log(`[termii] DEV FALLBACK (no TERMII_API_KEY) — SMS to ${phone}: ${message}`);
    return { delivered: false };
  }

  const res = await fetch(TERMII_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toTermiiMsisdn(phone),
      from: senderId,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: apiKey,
    }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  // Termii replies 200 with a message_id on success; anything else is a
  // failure — but we don't throw, callers decide whether SMS is critical.
  const ok = res.ok && (json?.status === "success" || !!json?.message_id);
  if (!ok) {
    throw new Error(json?.message ?? `Termii SMS failed (HTTP ${res.status})`);
  }
  return { delivered: true };
}
