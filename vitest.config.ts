import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(__dirname, "./app"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    env: {
      VITE_LOG_LEVEL: "silent",
    },
    include: ["test/unit/**/*.test.ts"],
  },
});
