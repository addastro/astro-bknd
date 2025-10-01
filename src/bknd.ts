// src/bknd.ts
import type { AstroGlobal } from "astro";
import { createApp } from "bknd/adapter/cloudflare";
import config from "../config";

export { config };

export async function getApi(
   astro: AstroGlobal,
   opts?: { mode: "static" } | { mode?: "dynamic"; verify?: boolean }
) {
   const env = astro.locals.runtime.env;

   const cleanEnv = {
      DB: env.DB,
      BUCKET: env.BUCKET,
      ASSETS: env.ASSETS,
      ENVIRONMENT: env.ENVIRONMENT,
      // --- PŘIDEJTE TENTO ŘÁDEK ---
      SECRET: env.SECRET,
      // ----------------------------
   };

   const app = await createApp(config, { env: cleanEnv });

   if (opts?.mode !== "static" && opts?.verify) {
      const api = app.getApi({ headers: astro.request.headers });
      await api.verifyAuth();
      return api;
   }

   return app.getApi();
}
