import { describe, it, expect, vi, beforeEach } from "vitest";

const { debug, warn, error } = vi.hoisted(() => ({
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("~/util/logger", () => ({
  logger: { debug, warn, error, info: vi.fn(), log: vi.fn() },
}));

import f from "~/util/mock-fetch";

const mockFetch = vi.fn<typeof fetch>();
global.fetch = mockFetch;

const url = "https://migrator.example.com/export-repo";

describe("mock-fetch (f)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    debug.mockReset();
    warn.mockReset();
    error.mockReset();
  });

  it("returns the response and logs debug on success", async () => {
    const ok = new Response("{}", { status: 200 });
    mockFetch.mockResolvedValueOnce(ok);

    const res = await f(url, { method: "POST" });

    expect(res).toBe(ok);
    expect(debug).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    // forwards the caller's init and attaches an abort signal for the timeout
    const [, init] = mockFetch.mock.calls[0];
    expect(init).toMatchObject({ method: "POST" });
    expect((init as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it("returns the response and warns on a non-ok status", async () => {
    const bad = new Response("nope", {
      status: 500,
      statusText: "Internal Server Error",
    });
    mockFetch.mockResolvedValueOnce(bad);

    const res = await f(url, { method: "POST" });

    expect(res).toBe(bad);
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain("POST");
    expect(message).toContain(url);
    expect(message).toContain("500");
    expect(error).not.toHaveBeenCalled();
  });

  it("logs error details and rethrows when the fetch fails", async () => {
    const failure = Object.assign(new Error("fetch failed"), {
      cause: { code: "UND_ERR_SOCKET", message: "other side closed" },
    });
    mockFetch.mockRejectedValueOnce(failure);

    await expect(f(url, { method: "POST" })).rejects.toBe(failure);

    expect(error).toHaveBeenCalledTimes(1);
    const [message, details] = error.mock.calls[0];
    expect(String(message)).toContain("POST");
    expect(String(message)).toContain(url);
    expect(details).toMatchObject({
      name: "Error",
      message: "fetch failed",
      code: "UND_ERR_SOCKET",
      cause: "other side closed",
    });
  });

  it("defaults the logged method to GET when none is provided", async () => {
    mockFetch.mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await f(url);

    expect(String(debug.mock.calls[0][0])).toContain("GET");
  });
});
