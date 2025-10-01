import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { devFsVitePlugin } from "bknd/adapter/cloudflare";

export default defineConfig({
  clearScreen: false,
  plugins: [
    cloudflare(),
    devFsVitePlugin({
      configFile: "config.ts",
    }),
  ],
});
