import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("backup-your-data", "routes/backup-your-data.tsx"),
  route("new-account", "routes/new-account.tsx"),
  route("connect-bluesky", "routes/bluesky-login.tsx"),
  route("validate-plc-token", "routes/validate-plc-token.tsx"),
  route("migration", "routes/migration-progress.tsx"),
] satisfies RouteConfig;
