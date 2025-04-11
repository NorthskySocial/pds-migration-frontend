import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("failed", "routes/failed.tsx"),
  route("success", "routes/success.tsx"),
] satisfies RouteConfig;
