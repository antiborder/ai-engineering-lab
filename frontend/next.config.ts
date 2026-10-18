import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a fully static site into `out/`: every page is plain HTML/CSS/JS
  // and every lab runs in the browser, so it can be hosted on any static
  // host with no server and no per-request cost.
  output: "export",
  // Emit `/genai/rag/index.html` instead of `/genai/rag.html`, so plain
  // static hosts serve `/genai/rag` without extra rewrite rules.
  trailingSlash: true,
  // Lets the dev server accept requests proxied through a Cloudflare quick
  // tunnel (random *.trycloudflare.com hostname each run), for checking the
  // app from a phone. Dev-only; has no effect on a production build.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
