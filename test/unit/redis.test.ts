import { beforeEach, describe, expect, it, vi } from "vitest";
import { redisDel, redisDelIfValueMatches, redisGet, redisSet, redisSetNxEx } from "~/util/redis";

const client = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  eval: vi.fn(),
}));

vi.mock("ioredis", () => ({
  default: class {
    get = client.get;
    set = client.set;
    del = client.del;
    eval = client.eval;
  },
}));

describe("Redis helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(["stored-value", null])("returns the stored value %s", async (value) => {
    client.get.mockResolvedValueOnce(value);

    await expect(redisGet("session-key")).resolves.toBe(value);

    expect(client.get).toHaveBeenCalledExactlyOnceWith("session-key");
  });

  it("stores a value with an expiry in seconds", async () => {
    client.set.mockResolvedValueOnce("OK");

    await expect(redisSet("session-key", 90, "session-data")).resolves.toBeUndefined();

    expect(client.set).toHaveBeenCalledExactlyOnceWith("session-key", "session-data", "EX", 90);
  });

  it.each([
    ["OK", true],
    [null, false],
  ])("maps lock result %s to %s", async (result, acquired) => {
    client.set.mockResolvedValueOnce(result);

    await expect(redisSetNxEx("lock-key", 30, "owner-token")).resolves.toBe(acquired);

    expect(client.set).toHaveBeenCalledExactlyOnceWith("lock-key", "owner-token", "EX", 30, "NX");
  });

  it("deletes a key", async () => {
    client.del.mockResolvedValueOnce(1);

    await expect(redisDel("session-key")).resolves.toBeUndefined();

    expect(client.del).toHaveBeenCalledExactlyOnceWith("session-key");
  });

  it.each([
    [1, true],
    [0, false],
  ])("maps conditional deletion result %s to %s", async (result, deleted) => {
    client.eval.mockResolvedValueOnce(result);

    await expect(redisDelIfValueMatches("lock-key", "owner-token")).resolves.toBe(deleted);

    expect(client.eval).toHaveBeenCalledExactlyOnceWith(
      "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
      1,
      "lock-key",
      "owner-token",
    );
  });

  it.each([
    { name: "get", mock: client.get, run: () => redisGet("key") },
    { name: "set", mock: client.set, run: () => redisSet("key", 30, "value") },
    { name: "lock", mock: client.set, run: () => redisSetNxEx("key", 30, "value") },
    { name: "delete", mock: client.del, run: () => redisDel("key") },
    {
      name: "conditional delete",
      mock: client.eval,
      run: () => redisDelIfValueMatches("key", "value"),
    },
  ])("propagates a $name failure", async ({ mock, run }) => {
    const error = new Error("Redis unavailable");
    mock.mockRejectedValueOnce(error);

    await expect(run()).rejects.toBe(error);
  });
});
