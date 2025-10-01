// src/pages/api/[...api].ts

import { createApp } from "bknd/adapter/cloudflare";
import config from "../../../config";
import type { APIContext } from "astro";

export const prerender = false;

export const ALL = async (context: APIContext) => {
   const env = context.locals.runtime.env;

   // Ručně vytvoříme instanci pomocí metody, která prokazatelně funguje.
   const app = await createApp(config, { env });

   // Předáme požadavek internímu handleru bknd (který je postaven na Hono).
   return app.fetch(context.request);
};
