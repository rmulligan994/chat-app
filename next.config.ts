import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/chat-app",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/chat-app",
  },
  // Prevent trailing-slash redirects that convert POST → GET
  skipTrailingSlashRedirect: true,
  // Keep pdf-parse out of the esbuild bundle — it pulls in pdfjs-dist
  // which is too large and crashes esbuild in the Workers build environment
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
