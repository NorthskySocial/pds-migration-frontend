import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkIfDidExistsInDest, verifyOriginPdsReachable } from "~/actions";
import { LoginError } from "~/errors";
import { XRPC_ERROR_MESSAGES } from "~/util/xrpc-errors";

vi.mock("~/util/logger", () => ({
  logger: {
    withDid: () => ({ warn: vi.fn() }),
    warn: vi.fn(),
  },
}));

const mockFetch = vi.fn<typeof fetch>();
global.fetch = mockFetch;

describe("checkIfDidExistsInDest", () => {
  const testDid = "did:plc:test123";
  const testPdsDest = "https://pds.example.com";

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should return didExists: true and didActive: true when response is ok and active is true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ active: true }),
    } as Response);

    const result = await checkIfDidExistsInDest(testDid, testPdsDest);

    expect(result).toEqual({ didExists: true, didActive: true });
    expect(mockFetch).toHaveBeenCalledWith(
      `${testPdsDest}/xrpc/com.atproto.sync.getRepoStatus?did=${testDid}`,
      { method: "get", headers: { "Content-Type": "application/json" } }
    );
  });

  it("should return didExists: true and didActive: false when response is ok but active is false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ active: false }),
    } as Response);

    const result = await checkIfDidExistsInDest(testDid, testPdsDest);

    expect(result).toEqual({ didExists: true, didActive: false });
  });

  it("should return didExists: true and didActive: false when response is ok but active is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const result = await checkIfDidExistsInDest(testDid, testPdsDest);

    expect(result).toEqual({ didExists: true, didActive: false });
  });

  it("should return didExists: false and didActive: false when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await checkIfDidExistsInDest(testDid, testPdsDest);

    expect(result).toEqual({ didExists: false, didActive: false });
  });

  it("should return didExists: false and didActive: false when fetch throws an error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await checkIfDidExistsInDest(testDid, testPdsDest);

    expect(result).toEqual({ didExists: false, didActive: false });
  });
});

describe("verifyOriginPdsReachable", () => {
  const pdsOrigin = "https://pds.example.com";
  const describeUrl = `${pdsOrigin}/xrpc/com.atproto.server.describeServer`;

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("resolves when describeServer returns 200 with a non-empty did", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ did: "did:web:pds.example.com" }),
    } as Response);

    await expect(verifyOriginPdsReachable(pdsOrigin)).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(String(calledUrl)).toBe(describeUrl);
    expect(calledInit).toMatchObject({ method: "GET" });
  });

  it("throws an Expected LoginError when the response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({}),
    } as Response);

    await expect(verifyOriginPdsReachable(pdsOrigin)).rejects.toMatchObject({
      name: "LoginError",
      message: XRPC_ERROR_MESSAGES.UNREACHABLE_ORIGIN_PDS,
      errorType: "Expected",
    });
  });

  it("throws an Expected LoginError when the JSON body is invalid", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Response);

    await expect(verifyOriginPdsReachable(pdsOrigin)).rejects.toBeInstanceOf(
      LoginError
    );
  });

  it("throws an Expected LoginError when the response body has no did", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ availableUserDomains: [".example.com"] }),
    } as Response);

    await expect(verifyOriginPdsReachable(pdsOrigin)).rejects.toMatchObject({
      message: XRPC_ERROR_MESSAGES.UNREACHABLE_ORIGIN_PDS,
      errorType: "Expected",
    });
  });

  it("throws an Expected LoginError when the did is an empty string", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ did: "" }),
    } as Response);

    await expect(verifyOriginPdsReachable(pdsOrigin)).rejects.toBeInstanceOf(
      LoginError
    );
  });

  it("throws an Expected LoginError when the did is not a string", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ did: 123 }),
    } as Response);

    await expect(verifyOriginPdsReachable(pdsOrigin)).rejects.toBeInstanceOf(
      LoginError
    );
  });

  it("throws an Expected LoginError when fetch rejects (network failure)", async () => {
    mockFetch.mockRejectedValueOnce(
      Object.assign(new Error("fetch failed"), {
        cause: { code: "ENOTFOUND" },
      })
    );

    await expect(verifyOriginPdsReachable(pdsOrigin)).rejects.toMatchObject({
      message: XRPC_ERROR_MESSAGES.UNREACHABLE_ORIGIN_PDS,
      errorType: "Expected",
    });
  });

  it("throws an Expected LoginError on an unexpected synchronous error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));

    await expect(verifyOriginPdsReachable(pdsOrigin)).rejects.toBeInstanceOf(
      LoginError
    );
  });
});
