import "dotenv/config";

// One-off real-SMS test through Termii using the exact same request shape
// as src/lib/services/termii.ts (sendSms). Does not print the API key.
function toTermiiMsisdn(phone: string): string {
  const digits = phone.replace(/[\s()+-]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

async function main() {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) {
    console.log("TERMII_API_KEY not set");
    return;
  }
  const phone = process.argv[2] ?? "09132376668";
  const sender = process.argv[3] ?? process.env.TERMII_SENDER_ID ?? "NovaNet";
  const message =
    "NovaNet test: SMS delivery is live. If you can read this, Termii is configured correctly.";

  const res = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toTermiiMsisdn(phone),
      from: sender,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: apiKey,
    }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  // Mask anything sensitive; message_id / balance are fine to show.
  console.log(`HTTP ${res.status}: ${JSON.stringify(json)}`);
}

main();
