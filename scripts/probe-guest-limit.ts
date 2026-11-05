const BASE = "http://localhost:3000";

export {};

async function probeOnce(i: number) {
  const res = await fetch(`${BASE}/api/vouchers/guest-purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: "bogus-probe", provider: "PAYSTACK", phone: "08123456789", email: "x@example.com" }),
  });
  const json = await res.json().catch(() => ({}));
  console.log(`probe ${i}: ${res.status} ${json.error ?? ""}`);
}

async function main() {
  for (let i = 1; i <= 8; i++) await probeOnce(i);
}

main();
