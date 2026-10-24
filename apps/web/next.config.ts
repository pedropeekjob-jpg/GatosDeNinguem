import type { NextConfig } from "next";

/** STATIC_EXPORT=1 builds the demo for GitHub Pages: plain files, demo content, no server. */
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const config: NextConfig = {
  ...(staticExport ? { output: "export" as const, trailingSlash: true, basePath } : {}),
  // Workspace packages ship TypeScript source.
  // Without an API (the GitHub Pages demo, tests) accounts and Patinhas run in the browser on example data.
  // FEATURES switches on optional parts (patinhas, trocas, amigo); the same setting as the API's.
  env: { NEXT_PUBLIC_CONTAS_DEMO: process.env.API_URL ? "" : "1", NEXT_PUBLIC_FEATURES: process.env.FEATURES ?? process.env.NEXT_PUBLIC_FEATURES ?? "" },
  transpilePackages: ["@gn/ui", "@gn/domain", "@gn/seo"],
  poweredByHeader: false,
  images: { unoptimized: true },
  // Static hosting cannot send headers; the real deploy does.
  headers: staticExport ? undefined : async () => {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default config;
