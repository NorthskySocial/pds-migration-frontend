import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_SESSION_DATA } from "~/session-data";
import { initSession } from "~/sessions.server";
import { redisDel, redisGet, redisSet } from "~/util/redis";

const sessions = vi.hoisted(() => new Map<string, string>());

vi.mock("~/util/redis", () => ({
  redisGet: vi.fn(async (key: string) => sessions.get(key) ?? null),
  redisSet: vi.fn(async (key: string, _ttl: number, value: string) => {
    sessions.set(key, value);
  }),
  redisDel: vi.fn(async (key: string) => {
    sessions.delete(key);
  }),
}));

describe("session storage", () => {
  let storage: ReturnType<typeof initSession>;

  beforeEach(() => {
    sessions.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    vi.stubEnv("SESSION_SECRET", "test-session-secret");
    storage = initSession();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("starts an empty session without reading Redis when there is no cookie", async () => {
    const session = await storage.getSession();

    expect(session.id).toBe("");
    expect(session.data).toEqual({});
    expect(redisGet).not.toHaveBeenCalled();
  });

  it("stores a new session for four hours and returns a secure cookie", async () => {
    storage = initSession("migration.example");
    const session = await storage.getSession();
    session.set("did", "did:plc:test");

    const cookie = await storage.commitSession(session);

    expect(redisSet).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(/^sess:sid:/),
      14400,
      JSON.stringify({ did: "did:plc:test" }),
    );
    expect(cookie).toContain("__session=");
    expect(cookie).toContain("Max-Age=14400");
    expect(cookie).toContain("Domain=migration.example");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
  });

  it("restores stored values and fills missing session defaults", async () => {
    const session = await storage.getSession();
    session.set("did", "did:plc:test");
    session.set("exportedRepo", true);
    const cookie = await storage.commitSession(session);

    const restored = await storage.getSession(cookie);

    expect(restored.data).toEqual({
      ...INITIAL_SESSION_DATA,
      did: "did:plc:test",
      exportedRepo: true,
    });
    expect(redisGet).toHaveBeenCalledExactlyOnceWith(`sess:${restored.id}`);
  });

  it.each([null, "{invalid JSON"])(
    "returns empty session data when stored data is %s",
    async (raw) => {
      const session = await storage.getSession();
      session.set("did", "did:plc:test");
      const cookie = await storage.commitSession(session);
      const key = vi.mocked(redisSet).mock.calls[0][0];
      if (raw === null) {
        sessions.delete(key);
      } else {
        sessions.set(key, raw);
      }

      const restored = await storage.getSession(cookie);

      expect(redisGet).toHaveBeenCalledExactlyOnceWith(key);
      expect(`sess:${restored.id}`).toBe(key);
      expect(restored.data).toEqual({});
    },
  );

  it("updates the same session record and its expiry", async () => {
    const session = await storage.getSession();
    const cookie = await storage.commitSession(session);
    const restored = await storage.getSession(cookie);
    restored.set("hasBackup", true);

    await storage.commitSession(restored, { maxAge: 300 });

    expect(redisSet).toHaveBeenCalledTimes(2);
    expect(redisSet).toHaveBeenLastCalledWith(
      `sess:${restored.id}`,
      300,
      JSON.stringify(restored.data),
    );
    expect(sessions.size).toBe(1);
    expect(JSON.parse(sessions.get(`sess:${restored.id}`)!)).toMatchObject({ hasBackup: true });
  });

  it("uses a minimum Redis TTL of one second for an expired session", async () => {
    const session = await storage.getSession();

    await storage.commitSession(session, { maxAge: 0 });

    expect(redisSet).toHaveBeenCalledExactlyOnceWith(expect.stringMatching(/^sess:sid:/), 1, "{}");
  });

  it("deletes a stored session and expires its cookie", async () => {
    const session = await storage.getSession();
    const cookie = await storage.commitSession(session);
    const restored = await storage.getSession(cookie);

    const expiredCookie = await storage.destroySession(restored);

    expect(redisDel).toHaveBeenCalledExactlyOnceWith(`sess:${restored.id}`);
    expect(sessions.size).toBe(0);
    expect(expiredCookie).toContain("__session=;");
    expect(expiredCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect((await storage.getSession(cookie)).data).toEqual({});
    expect((await storage.getSession(expiredCookie)).id).toBe("");
  });

  it("does not delete a Redis record for an unsaved session", async () => {
    const session = await storage.getSession();

    await storage.destroySession(session);

    expect(redisDel).not.toHaveBeenCalled();
  });

  it("propagates a Redis read failure", async () => {
    const session = await storage.getSession();
    const cookie = await storage.commitSession(session);
    const error = new Error("Redis unavailable");
    vi.mocked(redisGet).mockRejectedValueOnce(error);

    await expect(storage.getSession(cookie)).rejects.toBe(error);
  });

  it("propagates a Redis write failure", async () => {
    const session = await storage.getSession();
    const error = new Error("Redis unavailable");
    vi.mocked(redisSet).mockRejectedValueOnce(error);

    await expect(storage.commitSession(session)).rejects.toBe(error);
  });

  it("propagates a Redis deletion failure", async () => {
    const session = await storage.getSession();
    const cookie = await storage.commitSession(session);
    const restored = await storage.getSession(cookie);
    const error = new Error("Redis unavailable");
    vi.mocked(redisDel).mockRejectedValueOnce(error);

    await expect(storage.destroySession(restored)).rejects.toBe(error);
  });
});
