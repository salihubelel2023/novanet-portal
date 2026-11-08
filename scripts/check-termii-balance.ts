import "dotenv/config";

// Validates the Termii API key against the balance endpoint without
// sending an SMS or printing the key itself.
async function main() {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) {
    console.log("TERMII_API_KEY not set");
    return;
  }
  console.log(`key loaded (length ${apiKey.length})`);

  const res = await fetch(`https://api.ng.termii.com/api/sms/balance?api_key=${encodeURIComponent(apiKey)}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  console.log(`HTTP ${res.status}: ${JSON.stringify(json)}`);
}

main();
