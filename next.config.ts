import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/chat-app",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/chat-app",
  },
  // Externalize pdf-parse from the Next.js bundle to avoid fs issues
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
