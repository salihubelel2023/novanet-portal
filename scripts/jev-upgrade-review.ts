/**
 * Dogfood harness: asks TypeSafe's Jev (System One) typed questions about this
 * project's dependency-upgrade state and prints a verdict table.
 *
 * No dependencies. Uses the raw HTTP API so the upgrade itself adds nothing to install.
 *
 * Run:
 *   1. Get a key at https://console.typesafe.ai/keys
 *   2. set TYPESAFE_API_KEY=<key> in your shell (do NOT commit it)
 *   3. npx tsx scripts/jev-upgrade-review.ts
 *
 * Only the metadata below is sent to the API — no source code, no secrets.
 * A failed call raises an error; it is never treated as an answer.
 */

const UPGRADE_STATE = {
  project: {
    name: "novanet-portal",
    kind: "production Next.js 15 portal for a managed ISP (payments via Paystack/Flutterwave, MikroTik, Starlink)",
    constraint: "delicate production system; upgrades must not break behavior",
  },
  verification_evidence: {
    type_check: "pass",
    unit_tests: "pass (3/3, only existing suite)",
    eslint: "pass (0 warnings)",
    next_build: "pass (all pages compiled)",
    coverage_note:
      "no browser/E2E tests exist; verification is type-level, unit-level and build-level only",
  },
  applied_upgrades: [
    { dependency: "next", from: "15.5.10", to: "15.5.28", nature: "patch line, security backports" },
    { dependency: "next-auth", from: "5.0.0-beta.25", to: "5.0.0-beta.32", nature: "fixes critical Auth.js advisories via @auth/core 0.41.3" },
    { dependency: "zod", from: "3.25.76", to: "4.6.7", nature: "major; fixes high-severity memory-exhaustion advisory" },
    { dependency: "@hookform/resolvers", from: "3.10.0", to: "6.0.1", nature: "major, paired with zod 4" },
    { dependency: "postcss", to: "8.5.32", nature: "override forces fixed version over bundled vulnerable copy" },
  ],
  deferred_majors: [
    {
      dependency: "next",
      version: "16.4.3",
      usage_facts:
        "middleware uses NextAuth(authConfig) with NextResponse; <Image> never imported; dynamic params already awaited (11 files); uses `next lint` script (removed in Next 16)",
    },
    {
      dependency: "tailwindcss",
      version: "4.3.3",
      usage_facts:
        "tailwind.config.ts with 1 plugin (tailwindcss-animate), shadcn HSL CSS variables, custom keyframes; globals.css uses 3 @tailwind and 5 @apply directives",
    },
    {
      dependency: "recharts",
      version: "3.10.1",
      usage_facts:
        "3 chart files, all basic components (Area/Pie/Bar/Tooltip/Legend/Cell), no custom tooltip content, no ReferenceLine",
    },
  ],
  runtime_facts: [
    "bcryptjs is imported only in auth.ts and two Node-runtime API routes; middleware.ts imports only edge-safe auth.config.ts",
    "engines node >=20.9; Dockerfile uses node:20-alpine",
    "public API route handlers validate untrusted body JSON with zod schemas",
  ],
};

const questions = {
  upgrade_confidence: {
    type: "score",
    instructions:
      "How strongly does `verification_evidence` in the state support that the applied upgrades did not change application behavior?",
    criteria: [
      "Evidence is thin: coverage_note shows a gap that the applied upgrades could plausibly act through",
      "One meaningful verification dimension is missing but the others directly touch the upgraded packages, such as runtime behavior of validation and auth",
      "Every dimension that could observe behavioral change from these upgrades is covered by the shown evidence",
    ],
  },
  residual_qa_need: {
    type: "noul",
    instructions:
      "Some applied change could alter behavior of a user-facing path without any shown verification checking that path.",
    // false = every change has coverage; true = a gap exists that manual QA should close
  },
  next16_disruption: {
    type: "choice",
    instructions:
      "How disruptive is adopting Next.js 16 for `novanet-portal` today, given the usage facts in the state?",
    criteria: {
      config_level: "Changes are limited to configuration and scripts; no component or route code needs edits",
      code_level: "A handful of files need mechanical edits, such as the lint script and config flags",
      structural: "Component, route or auth wiring needs rework beyond mechanical edits",
    },
  },
  tailwind4_disruption: {
    type: "choice",
    instructions:
      "How disruptive is adopting Tailwind CSS 4 for `novanet-portal` today, given the usage facts in the state?",
    criteria: {
      config_level: "CSS entry and config convert mechanically without touching components",
      code_level: "Component classes or the CSS variable theme need rework beyond a mechanical conversion",
      structural: "Theme tokens, plugin behavior or @apply usage require redesign",
    },
  },
  recharts3_disruption: {
    type: "choice",
    instructions:
      "How disruptive is adopting recharts 3 for `novanet-portal` today, given the usage facts in the state?",
    criteria: {
      config_level: "Imports and props in use survive unchanged; a version bump compiles and renders",
      code_level: "Chart files need prop or import edits, but only inside the three chart components",
      structural: "Chart behavior or layout integration needs redesign",
    },
  },
  edge_bcrypt_risk: {
    type: "noul",
    instructions:
      "Upgrading bcryptjs could break code that runs in the edge runtime where it does not work, because an import chain would pull it into edge code.",
    // false = state shows bcryptjs imports are confined to Node-runtime files and the edge bundle never imports them
  },
};

async function main() {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    console.error("TYPESAFE_API_KEY is not set. Get one at https://console.typesafe.ai/keys");
    process.exit(1);
  }

  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ state: UPGRADE_STATE, model: "jev-latest", questions }),
  });

  if (!res.ok) {
    // Surface as an error, never as an answer.
    throw new Error(`TypeSafe API failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    answers: Record<string, any>;
    usage: { input_tokens: number; output_tokens: number };
  };

  // Code decides: map Jev's judgments to actions with explicit thresholds.
  const confidence = json.answers.upgrade_confidence;
  const residual = json.answers.residual_qa_need.noul;
  const residualRead =
    residual > 0.7 ? "YES - run a manual smoke test of login, redeem and payment flows"
      : residual < 0.3 ? "no obvious unfocused risk; standard regression pass is enough"
        : "unclear - treat as YES and smoke-test";

  console.log("== Jev judgment review of the dependency upgrade ==");
  console.log(`\nupgrade_confidence: ${JSON.stringify(confidence.score)} (probabilities ${JSON.stringify(confidence.probabilities)})`);
  console.log(`residual_qa_need: noul=${residual} -> ${residualRead}`);

  for (const key of ["next16_disruption", "tailwind4_disruption", "recharts3_disruption"]) {
    const a = json.answers[key];
    console.log(`\n${key}: top=${a.choice} p=${a.probabilities[a.choice]} -> ${a.choice === "config_level"
      ? "safe to schedule any time"
      : a.choice === "code_level"
        ? "schedule a dedicated session with build + manual QA"
        : "hold; needs design and staged testing"}`);
  }

  const edge = json.answers.edge_bcrypt_risk.noul;
  console.log(`\nedge_bcrypt bcryptjs edge risk: noul=${edge} -> ${edge > 0.3 ? "inspect middleware import chain before touching bcryptjs" : "keep bcryptjs on the current line"}`);
  console.log(`\nusage: ${json.usage.input_tokens} in / ${json.usage.output_tokens} out`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
