import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/1_home.tsx"),
  route("backup-your-data", "routes/2_backup-your-data.tsx"),
  route("connect-bluesky", "routes/3_bluesky-login.tsx"),
  route("new-account", "routes/4_new-account.tsx"),
  route("migrate", "routes/5_migration-progress.tsx"),
  route("validate-plc-token", "routes/6_validate-plc-token.tsx"),
  route("done", "routes/7_done.tsx"),
] satisfies RouteConfig;
