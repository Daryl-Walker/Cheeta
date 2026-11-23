import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dev-only proxy for SX Bet, as a Vite middleware plugin.
 *
 * api.sx.bet sends no CORS headers, so a direct browser fetch is blocked.
 * This forwards `/sx/*` from the dev server (Node `fetch`, which honours
 * the machine's proxy settings) to https://api.sx.bet — no key or secret
 * is involved, it only forwards read-only public listings. It exists only
 * in `vite dev`; a production build has no such route, so SX Bet shows as
 * "unavailable" there and the rest of the feed keeps working. Production
 * needs a same-origin proxy or server-side fetch — a follow-up.
 */
function sxBetDevProxy(): Plugin {
  return {
    name: "sx-bet-dev-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/sx", async (req, res, next) => {
        try {
          const target = `https://api.sx.bet${req.url ?? ""}`;
          const upstream = await fetch(target, {
            headers: { accept: "application/json" },
          });
          res.statusCode = upstream.status;
          res.setHeader(
            "content-type",
            upstream.headers.get("content-type") ?? "application/json",
          );
          res.end(await upstream.text());
        } catch (e) {
          next(e instanceof Error ? e : new Error("SX Bet proxy failed."));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sxBetDevProxy()],
  resolve: {
    alias: {
      // Use the contracts source directly so the web app works without a
      // separate `npm run build --workspace @cheeta/contracts` step.
      "@cheeta/contracts": path.resolve(root, "../../packages/contracts/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    // Proxy API calls in local dev so the browser does not hit CORS on the
    // Express API (services/api has no CORS middleware yet). In production
    // the API must allow the web origin — see README.md.
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
      "/health": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
