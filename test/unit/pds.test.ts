import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkIfDidExistsInDest } from "~/util/pds";

vi.mock("~/util/logger", () => ({
  logger: {
    withDid: () => ({ warn: vi.fn() }),
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
