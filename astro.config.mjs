// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

// Správná verze configu pro tento starter kit
export default defineConfig({
  output: "server",
  integrations: [react()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    // --- PŘIDEJTE TENTO BLOK ---
    runtime: {
      mode: "local",
      type: "pages",
    },
    // --------------------------
  }),
});
