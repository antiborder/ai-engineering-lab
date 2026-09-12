import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets the dev server accept requests proxied through a Cloudflare quick
  // tunnel (random *.trycloudflare.com hostname each run), for checking the
  // app from a phone. Dev-only; has no effect on a production build.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
