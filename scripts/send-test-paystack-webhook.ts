import "dotenv/config";
import crypto from "crypto";

/**
 * Sends a Paystack-format `charge.success` webhook, signed exactly the way
 * Paystack signs them (HMAC-SHA512 of the raw body with the secret key).
 * Test-mode only: the reference belongs to a PENDING payment created by our
 * own smoke test on the owner's site, with the owner's explicit request.
 */
const secret = process.env.PAYSTACK_SECRET_KEY;
if (!secret) {
  console.error("PAYSTACK_SECRET_KEY missing");
  process.exit(1);
}
if (!secret.startsWith("sk_test")) {
  console.error("Refusing to run: secret key is not a test key");
  process.exit(1);
}

const reference = process.argv[2];
if (!reference) {
  console.error("usage: tsx scripts/send-test-paystack-webhook.ts <reference> [targetUrl]");
  process.exit(1);
}
const target = process.argv[3] ?? "https://novanet-portal.vercel.app/api/payments/paystack/webhook";

const body = JSON.stringify({
  event: "charge.success",
  data: {
    status: "success",
    reference,
    amount: 50000, // kobo (N500)
    currency: "NGN",
    channel: "card",
  },
});

const signature = crypto.createHmac("sha512", secret).update(body).digest("hex");

async function main() {
  const res = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-paystack-signature": signature,
    },
    body,
  });

  const text = await res.text();
  console.log(`target: ${target}`);
  console.log(`status: ${res.status}`);
  console.log(`body:   ${text.slice(0, 200)}`);
}

main();
