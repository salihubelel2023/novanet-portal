import "dotenv/config";

// Lists sender IDs registered to the Termii workspace (key never printed).
async function main() {
  const k = encodeURIComponent(process.env.TERMII_API_KEY ?? "");
  const res = await fetch(`https://api.ng.termii.com/api/sender-id?api_key=${k}`, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  console.log(`HTTP ${res.status}`);
  const content = (json as { content?: unknown[] } | null)?.content;
  if (Array.isArray(content)) {
    for (const s of content) console.log(JSON.stringify(s));
    if (content.length === 0) console.log("(no sender IDs registered)");
  } else {
    console.log(JSON.stringify(json));
  }
}

main();
