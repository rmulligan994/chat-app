import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/chat-app",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/chat-app",
  },
  // Prevent trailing-slash redirects that convert POST → GET
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
