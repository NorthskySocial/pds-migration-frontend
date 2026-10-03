import { createSessionStorage } from "react-router";
import { INITIAL_SESSION_DATA, type SessionData, type SessionFlashData } from "./session-data";
import { redisGet, redisSet, redisDel } from "./util/redis";

const SESSION_TTL_SECONDS = 60 * 60 * 4; // 4 hours

export const initSession = (hostname?: string) =>
  createSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__session",
      domain: hostname,
      httpOnly: true,
      maxAge: SESSION_TTL_SECONDS, // in seconds (1 day)
      path: "/",
      sameSite: "strict",
      secrets: [process.env?.SESSION_SECRET ?? "toastytoast"],
      secure: true,
    },
    async createData(data: Partial<SessionData>, expires?: Date | number) {
      const id = `sid:${crypto.randomUUID()}`;
      const ttl = computeTtlSeconds(expires, SESSION_TTL_SECONDS);
      await redisSet(sessionKey(id), ttl, JSON.stringify(data ?? {}));
      return id;
    },
    async readData(id: string) {
      if (!id) return null;

      const raw = await redisGet(sessionKey(id));
      if (!raw) return null;

      try {
        const parsed = JSON.parse(raw) as Partial<SessionData>;
        return {
          ...INITIAL_SESSION_DATA,
          ...parsed,
        };
      } catch {
        // Corrupt payload, drop it
        return null;
      }
    },
    async updateData(id: string, data: Partial<SessionData>, expires?: Date | number) {
      const ttl = computeTtlSeconds(expires, SESSION_TTL_SECONDS);
      await redisSet(sessionKey(id), ttl, JSON.stringify(data ?? {}));
    },
    async deleteData(id: string) {
      if (!id) return;
      await redisDel(sessionKey(id));
    },
  });

function sessionKey(id: string) {
  return `sess:${id}`;
}

function computeTtlSeconds(expires: Date | number | undefined, fallbackSeconds: number): number {
  if (!expires) return fallbackSeconds;

  if (typeof expires === "number") return Math.max(1, Math.floor(expires / 1000));

  const ms = expires.getTime() - Date.now();
  return Math.max(1, Math.floor(ms / 1000));
}

export const { getSession, commitSession, destroySession } = initSession();
