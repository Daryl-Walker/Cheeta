import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
