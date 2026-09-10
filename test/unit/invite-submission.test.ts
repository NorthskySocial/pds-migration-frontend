import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequestHandler, type ServerBuild } from "react-router";
import config from "../../react-router.config";
import { action, loader } from "~/routes/index.server";
import { STAGES } from "~/util/stages";

const { sessions, handleError } = vi.hoisted(() => ({
  sessions: new Map<string, string>(),
  handleError: vi.fn(),
}));

vi.mock("~/util/redis", () => ({
  redisGet: vi.fn(async (key: string) => sessions.get(key) ?? null),
  redisSet: vi.fn(async (key: string, _ttl: number, value: string) => {
    sessions.set(key, value);
  }),
  redisDel: vi.fn(async (key: string) => {
    sessions.delete(key);
  }),
}));
vi.mock("~/actions", () => ({ checkPdsHealth: vi.fn().mockResolvedValue(true) }));
vi.mock("~/util/jobs", () => ({ processBackgroundJobStage: vi.fn() }));
vi.mock("~/util/discord", () => ({ sendDiscordMessage: vi.fn() }));

const build: ServerBuild = {
  entry: {
    module: {
      default: (_request, status, headers, context) =>
        Response.json(context.staticHandlerContext.loaderData["routes/index"], {
          status,
          headers,
        }),
      handleError,
    },
  },
  routes: {
    root: { id: "root", path: "", module: { default: () => null } },
    "routes/index": {
      id: "routes/index",
      parentId: "root",
      index: true,
      module: { default: () => null, action, loader },
    },
  },
  assets: { entry: { module: "", imports: [] }, routes: {}, url: "", version: "test" },
  publicPath: "/",
  assetsBuildDirectory: "build/client",
  future: {},
  ssr: true,
  isSpaMode: false,
  prerender: [],
  routeDiscovery: { mode: "initial", manifestPath: "/__manifest" },
  allowedActionOrigins: config.allowedActionOrigins,
};

const formData = () =>
  new URLSearchParams({
    "invite-code": "dummy-invite-code",
    "agree-to-tos": "on",
    "agree-to-privacy": "on",
    create: "create",
  });

describe("invite submission through React Router", () => {
  beforeEach(() => {
    sessions.clear();
    vi.clearAllMocks();
    vi.stubEnv("UPSTREAM_OUTAGE", "false");
    vi.stubEnv("MIGRATOR_BACKEND", "http://migrator.test");
    vi.stubEnv("PDS_HOSTNAME", "https://pds.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["http://localhost:3000", "https://migrate.northsky.social"])(
    "advances to account creation with browser origin %s",
    async (origin) => {
      const serverUrl =
        origin === "http://localhost:3000" ? origin : "http://migrate.northsky.social";
      const handleRequest = createRequestHandler(build, "production");
      const initial = await handleRequest(new Request(`${serverUrl}/`));

      expect(initial.status).toBe(200);
      expect(await initial.json()).toMatchObject({ stage: STAGES.INVITE_CODE });
      const cookie = initial.headers.get("Set-Cookie")!.split(";")[0];

      const submitted = await handleRequest(
        new Request(`${serverUrl}/_.data?index`, {
          method: "POST",
          headers: { Origin: origin, Cookie: cookie },
          body: formData(),
        }),
      );

      expect(submitted.status).toBe(202);
      expect(await submitted.text()).toContain('"redirect"');
      expect(submitted.headers.get("Set-Cookie")).toBeTruthy();

      const updated = await handleRequest(
        new Request(`${serverUrl}/`, {
          headers: { Cookie: submitted.headers.get("Set-Cookie")!.split(";")[0] },
        }),
      );

      expect(updated.status).toBe(200);
      expect(await updated.json()).toMatchObject({
        stage: STAGES.CREATE_DEST_ACCOUNT,
        state: { inviteCode: "dummy-invite-code", do_journey: "create" },
      });
      expect(handleError).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      scenario: "an unrelated origin",
      origin: "https://untrusted.example",
      allowedActionOrigins: config.allowedActionOrigins,
    },
    {
      scenario: "the HTTPS proxy origin without the allowance",
      origin: "https://migrate.northsky.social",
      allowedActionOrigins: [],
    },
  ])("rejects $scenario without changing the session", async ({ origin, allowedActionOrigins }) => {
    const handleRequest = createRequestHandler({ ...build, allowedActionOrigins }, "production");
    const response = await handleRequest(
      new Request("http://migrate.northsky.social/_.data?index", {
        method: "POST",
        headers: { Origin: origin },
        body: formData(),
      }),
    );

    expect(response.status).toBe(400);
    await response.text();
    expect(sessions.size).toBe(0);
    expect(handleError).toHaveBeenCalledOnce();
  });
});
