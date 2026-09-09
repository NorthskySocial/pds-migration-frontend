import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { createSession } from "react-router";
import Index, { loader } from "~/routes/index";
import {
  commitSession,
  getSession,
  type SessionData,
  type SessionFlashData,
} from "~/sessions.server";
import { checkPdsHealth } from "~/actions";
import { getStage } from "~/util/get-stage";
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
vi.mock("~/util/logger", () => ({
  logger: { withDid: () => ({ error: vi.fn() }) },
}));
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
