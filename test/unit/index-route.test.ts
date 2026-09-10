import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { createSession } from "react-router";
import Index, { action, loader } from "~/routes/index";
import { commitSession, getSession } from "~/sessions.server";
import type { SessionData, SessionFlashData } from "~/session-data";
import { checkPdsHealth } from "~/actions";
import { BaseAppError } from "~/errors";
import { getStage } from "~/util/get-stage";
import { processState } from "~/util/process-state";
import { STAGES } from "~/util/stages";

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useFetcher: () => ({ state: "idle" }),
}));

vi.mock("~/sessions.server", () => ({
  getSession: vi.fn(),
  commitSession: vi.fn().mockResolvedValue("session-cookie"),
}));

vi.mock("~/actions", () => ({ checkPdsHealth: vi.fn() }));
vi.mock("~/util/get-stage", () => ({ getStage: vi.fn() }));
vi.mock("~/util/process-state", () => ({ processState: vi.fn() }));
vi.mock("~/components/layout", () => ({
  Layout: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("~/components/loading", () => ({ Loading: () => null }));
vi.mock("~/screens", async () => {
  const { STAGES } = await import("~/util/stages");
  return { SCREENS: { [STAGES.INVITE_CODE]: () => null } };
});

const loadPage = (url = "https://migration.example/") =>
  loader({ request: new Request(url) } as Parameters<typeof loader>[0]);

const renderPage = (loaderData: ComponentProps<typeof Index>["loaderData"]) =>
  renderToStaticMarkup(
    createElement(ChakraProvider, {
      value: defaultSystem,
      children: createElement(Index, { loaderData } as ComponentProps<typeof Index>),
    }),
  );

describe("index route action errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processState).mockReset();
    vi.stubEnv("MIGRATOR_BACKEND", "https://migrator.example");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    {
      scenario: "an application error",
      error: new BaseAppError("Invalid login code", "Expected"),
      message: "Invalid login code",
      errorType: "Expected",
    },
    {
      scenario: "an unexpected error",
      error: new Error("Backend unavailable"),
      message: "Backend unavailable",
      errorType: "Unexpected",
    },
    {
      scenario: "a non-Error rejection",
      error: "Backend unavailable",
      message: undefined,
      errorType: undefined,
    },
  ])("redirects and saves the session after $scenario", async ({ error, message, errorType }) => {
    const session = createSession<SessionData, SessionFlashData>();
    vi.mocked(getSession).mockResolvedValue(session);
    vi.mocked(processState).mockRejectedValue(error);
    const request = new Request("https://migration.example/", {
      method: "POST",
      body: new URLSearchParams({ "login-code": "123456" }),
    });

    const response = await action({ request } as Parameters<typeof action>[0]);

    expect(processState).toHaveBeenCalledExactlyOnceWith(
      session,
      expect.any(FormData),
      "https://migrator.example",
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(response.headers.get("Set-Cookie")).toBe("session-cookie");
    expect(commitSession).toHaveBeenCalledExactlyOnceWith(session);
    expect(session.get("error")).toBe(message);
    expect(session.get("errorType")).toBe(errorType);
    expect(getStage).not.toHaveBeenCalled();
  });

  it("reports a missing backend setting without processing the form", async () => {
    vi.stubEnv("MIGRATOR_BACKEND", undefined);
    const session = createSession<SessionData, SessionFlashData>();
    vi.mocked(getSession).mockResolvedValue(session);
    const request = new Request("https://migration.example/", {
      method: "POST",
      body: new URLSearchParams(),
    });

    const response = await action({ request } as Parameters<typeof action>[0]);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(response.headers.get("Set-Cookie")).toBe("session-cookie");
    expect(commitSession).toHaveBeenCalledExactlyOnceWith(session);
    expect(session.get("error")).toBe("MIGRATOR_BACKEND environment variable is not set");
    expect(session.get("errorType")).toBe("Unexpected");
    expect(processState).not.toHaveBeenCalled();
    expect(getStage).not.toHaveBeenCalled();
  });
});

describe("index route error title", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("UPSTREAM_OUTAGE", "false");
    vi.mocked(checkPdsHealth).mockResolvedValue(true);
    vi.mocked(getStage).mockReset();
    vi.mocked(getStage).mockReturnValue(STAGES.INVITE_CODE);
  });

  it("passes the flashed title to the error message and consumes it", async () => {
    const session = createSession<SessionData, SessionFlashData>();
    session.flash("title", "Two Factor Authentication");
    session.flash("error", "Please check your email for your login code and enter it below");
    session.flash("errorType", "Expected");
    vi.mocked(getSession).mockResolvedValue(session);

    const result = await loadPage();
    const html = renderPage(result.data);

    expect(result.data.title).toBe("Two Factor Authentication");
    expect(html).toContain("Two Factor Authentication");
    expect(html).toContain("Please check your email for your login code and enter it below");
    expect(html).not.toContain("Oh no!");
    expect(session.has("title")).toBe(false);
    expect(vi.mocked(commitSession).mock.calls[0][0].has("title")).toBe(false);
  });

  it("uses the default heading when no title is flashed", async () => {
    const session = createSession<SessionData, SessionFlashData>();
    session.flash("error", "Login failed");
    vi.mocked(getSession).mockResolvedValue(session);

    const result = await loadPage();

    expect(result.data.title).toBeUndefined();
    expect(renderPage(result.data)).toContain("Oh no!");
  });

  it("does not return an error title during maintenance", async () => {
    const session = createSession<SessionData, SessionFlashData>();
    session.flash("title", "Two Factor Authentication");
    vi.mocked(getSession).mockResolvedValue(session);

    const result = await loadPage("https://migration.example/?force_maintenance=true");

    expect(result.data.stage).toBe(STAGES.MAINTENANCE);
    expect(result.data.title).toBeUndefined();
  });

  it.each([
    { scenario: "an upstream outage", outage: "true", healthChecks: 0 },
    { scenario: "an unhealthy PDS", outage: "false", healthChecks: 1 },
  ])("returns maintenance during $scenario", async ({ outage, healthChecks }) => {
    vi.stubEnv("UPSTREAM_OUTAGE", outage);
    vi.stubEnv("SUPPORT_FORM_URL", "https://support.example/form");
    vi.mocked(checkPdsHealth).mockResolvedValue(false);
    const session = createSession<SessionData, SessionFlashData>();
    session.set("pds_dest", "https://private-pds.example");
    session.set("did", "did:plc:test123");
    vi.mocked(getSession).mockResolvedValue(session);

    const result = await loadPage();

    expect(result.data).toMatchObject({
      stage: STAGES.MAINTENANCE,
      isUpstreamOutage: outage === "true",
      supportFormUrl: "https://support.example/form",
      state: { did: "did:plc:test123" },
    });
    expect(result.data.state).not.toHaveProperty("pds_dest");
    expect(session.get("pds_dest")).toBe("https://private-pds.example");
    expect(checkPdsHealth).toHaveBeenCalledTimes(healthChecks);
    expect(getStage).not.toHaveBeenCalled();
    expect(commitSession).toHaveBeenCalledExactlyOnceWith(session);
  });

  it("does not use the flashed title for a loader failure", async () => {
    const session = createSession<SessionData, SessionFlashData>();
    session.flash("title", "Two Factor Authentication");
    vi.mocked(getSession).mockResolvedValue(session);
    vi.mocked(getStage).mockImplementation(() => {
      throw new Error("Stage failed");
    });

    const result = await loadPage();

    expect(result.data.stage).toBe(STAGES.FAILED);
    expect(result.data.error).toBe("Stage failed");
    expect(result.data.title).toBeUndefined();
  });
});
