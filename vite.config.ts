import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild, mode }) =>
  mode === "docker"
    ? {
        resolve: {
          dedupe: ["@chakra-ui/react", "next-themes"],
        },
        plugins: [reactRouter(), tsconfigPaths()],
      }
    : {
        build: {
          rollupOptions: isSsrBuild
            ? {
                input: "./workers/app.ts",
              }
            : undefined,
        },
        resolve: {
          dedupe: ["@chakra-ui/react", "next-themes"],
        },
        plugins: [
          cloudflare({ viteEnvironment: { name: "ssr" } }),
          reactRouter(),
          tsconfigPaths(),
        ],
      }
);
