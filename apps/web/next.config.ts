import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // apps/web is a self-contained npm project (own package.json/lockfile) living
  // inside a repo that also has a root package.json for scripts/agent-test.ts —
  // two lockfiles confuse Turbopack's root inference without this. See the
  // architecture doc's "single package.json, no workspaces" decision vs. what
  // create-next-app actually produces; adopting real npm workspaces would remove
  // the need for this pin, but that's a bigger call than this story's scope.
  turbopack: {
    root: path.join(__dirname),
  },
  // Story 6.1: headers do service worker conforme o guia de PWA do Next 16 — sem cache HTTP
  // (cada deploy entrega o SW novo) e CSP restrita à própria origem.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
