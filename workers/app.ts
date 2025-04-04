import { createRequestHandler } from "react-router";

declare global {
  interface CloudflareEnvironment {
    PDS_HOSTNAME: string;
    MIGRATOR_BACKEND: string;
    PLC_HOSTNAME?: string;
  }
}

declare module "react-router" {
  export interface AppLoadContext {
    PDS_HOSTNAME: string;
    MIGRATOR_BACKEND: string;
    PLC_HOSTNAME?: string;
  }
}

const requestHandler = createRequestHandler(
  // @ts-expect-error - virtual module provided by React Router at build time
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  fetch(request, env) {
    return requestHandler(request, {
      PDS_HOSTNAME: env.PDS_HOSTNAME,
      MIGRATOR_BACKEND: env.MIGRATOR_BACKEND,
      PLC_HOSTNAME: env.PLC_HOSTNAME,
    });
  },
} satisfies ExportedHandler<CloudflareEnvironment>;
