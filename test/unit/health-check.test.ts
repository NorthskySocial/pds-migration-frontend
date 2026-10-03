import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkPdsHealth } from "~/actions";
import { redisGet, redisSet } from "~/util/redis";

vi.mock("~/util/redis", () => ({
  redisGet: vi.fn(),
  redisSet: vi.fn(),
}));

const fetchMock = vi.fn<typeof fetch>();

describe("checkPdsHealth", () => {
  beforeEach(() => {
    vi.stubEnv("PDS_HOSTNAME", "https://pds.example.com");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.mocked(redisGet).mockReset().mockResolvedValue(null);
    vi.mocked(redisSet).mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([undefined, ""])("skips the check when PDS_HOSTNAME is %s", async (hostname) => {
    vi.stubEnv("PDS_HOSTNAME", hostname);

    await expect(checkPdsHealth()).resolves.toBe(true);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(redisGet).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it.each([
    ["true", true],
    ["false", false],
  ])("returns the cached health result %s without fetching", async (cached, expected) => {
    vi.mocked(redisGet).mockResolvedValueOnce(cached);

    await expect(checkPdsHealth()).resolves.toBe(expected);

    expect(redisGet).toHaveBeenCalledExactlyOnceWith("pds:health");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it("checks health with a timeout, resets failures, and caches success", async () => {
    const signal = new AbortController().signal;
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(checkPdsHealth()).resolves.toBe(true);

    expect(timeout).toHaveBeenCalledExactlyOnceWith(5000);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("https://pds.example.com/xrpc/_health", {
      method: "GET",
      signal,
    });
    expect(redisSet).toHaveBeenCalledTimes(2);
    expect(redisSet).toHaveBeenNthCalledWith(1, "pds:health:failures", 90, "0");
    expect(redisSet).toHaveBeenNthCalledWith(2, "pds:health", 10, "true");
  });

  it.each([
    [null, "1", true],
    ["1", "2", true],
    ["2", "3", true],
    ["3", "4", false],
    ["4", "5", false],
  ])("updates failures from %s to %s and returns healthy=%s", async (previous, next, healthy) => {
    vi.mocked(redisGet).mockResolvedValueOnce(null).mockResolvedValueOnce(previous);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(checkPdsHealth()).resolves.toBe(healthy);

    expect(redisGet).toHaveBeenNthCalledWith(1, "pds:health");
    expect(redisGet).toHaveBeenNthCalledWith(2, "pds:health:failures");
    expect(redisSet).toHaveBeenNthCalledWith(1, "pds:health:failures", 90, next);
    expect(redisSet).toHaveBeenCalledTimes(healthy ? 1 : 2);
    if (!healthy) {
      expect(redisSet).toHaveBeenNthCalledWith(2, "pds:health", 10, "false");
    }
  });

  it("counts a network failure toward the four-failure threshold", async () => {
    vi.mocked(redisGet).mockResolvedValueOnce(null).mockResolvedValueOnce("3");
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(checkPdsHealth()).resolves.toBe(false);

    expect(redisSet).toHaveBeenNthCalledWith(1, "pds:health:failures", 90, "4");
    expect(redisSet).toHaveBeenNthCalledWith(2, "pds:health", 10, "false");
  });

  it("still checks the PDS when reading the cache fails", async () => {
    vi.mocked(redisGet).mockRejectedValueOnce(new Error("Redis unavailable"));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(checkPdsHealth()).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(redisSet).toHaveBeenCalledWith("pds:health", 10, "true");
  });

  it("keeps a successful health result when caching it fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.mocked(redisSet)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Redis unavailable"));

    await expect(checkPdsHealth()).resolves.toBe(true);

    expect(redisSet).toHaveBeenCalledWith("pds:health", 10, "true");
  });

  it("returns healthy when the failure counter cannot be read", async () => {
    vi.mocked(redisGet)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("Redis unavailable"));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(checkPdsHealth()).resolves.toBe(true);

    expect(redisGet).toHaveBeenCalledWith("pds:health:failures");
    expect(redisSet).not.toHaveBeenCalled();
  });

  it("returns healthy when the failure counter cannot be written", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.mocked(redisSet).mockRejectedValueOnce(new Error("Redis unavailable"));

    await expect(checkPdsHealth()).resolves.toBe(true);

    expect(redisSet).toHaveBeenCalledExactlyOnceWith("pds:health:failures", 90, "1");
  });
});
