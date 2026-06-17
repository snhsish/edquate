import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

const backendUrl =
  process.env.API_BACKEND_URL?.replace(/\/+$/, "") ??
  "https://v2.edquate.com:8443";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  turbopack: {
    root,
  },
  async rewrites() {
    return [
      {
        source: "/api/v2/:path*",
        destination: `${backendUrl}/api/v2/:path*`,
      },
      {
        source: "/api/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
