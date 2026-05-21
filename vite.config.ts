import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: {
    dedupe: ["@chakra-ui/react", "next-themes"],
  },
  plugins: [reactRouter(), tsconfigPaths()],
});
