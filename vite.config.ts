import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    dedupe: ["@chakra-ui/react", "next-themes"],
    tsconfigPaths: true,
  },
  plugins: [reactRouter()],
});
