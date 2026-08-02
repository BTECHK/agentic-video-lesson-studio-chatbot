import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: 'standalone',
  // The repo has two lockfiles (root package-lock.json for the Remotion
  // project + this one for chatbot/). Turbopack's workspace-root inference
  // picks the outer one, then can't resolve "next" from there ("Next.js
  // package not found", panics on /content under concurrent load — see
  // https://github.com/vercel/next.js/issues/92978 and the "turbopack.root"
  // section of https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack).
  // Pin the root explicitly to silence the misdetection.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
