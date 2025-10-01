// src/env.d.ts
/// <reference types="astro/client" />

// Importuje typy z nově vygenerovaného souboru
/// <reference types="./worker-configuration.d.ts" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
