import { createRequestHandler } from "react-router";

declare global {
  interface CloudflareEnvironment {
    PDS_HOSTNAME: string;
    MIGRATOR_BACKEND: string;
    PLC_HOSTNAME?: string;
    HOSTNAME: string;
  }
}

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnvironment;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    // Expose log level globally for SSR code (logger reads this if present)
    const debugFlag = String((env as any).DEBUG ?? "").toLowerCase();
    const isDebug = debugFlag && debugFlag !== "false" && debugFlag !== "0";
    const level =
      (env as any).VITE_LOG_LEVEL || (isDebug ? "debug" : undefined);
    if (level) {
      (globalThis as any).__LOG_LEVEL = String(level).toLowerCase();
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<CloudflareEnvironment>;
