import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Docker, set output: "standalone" in your Dockerfile's build step.
  // Vercel handles bundling automatically, so no output mode is needed here.

  eslint: {
    // Linting is run explicitly in CI (see .github/workflows/ci.yml); we
    // don't want a lint warning to ever block a production build.
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
