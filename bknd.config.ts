import { withPlatformProxy } from "bknd/adapter/cloudflare/proxy";
import config from "./config.ts";

export default withPlatformProxy(config, {
  useProxy: true,
  proxyOptions: {
    environment: process.env.CLOUDFLARE_ENV,
  },
});
