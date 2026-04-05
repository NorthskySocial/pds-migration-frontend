import { createSessionStorage } from "react-router";
import type { AtpSessionData } from "@atproto/api/src/types";
import { redisGet, redisSet, redisDel } from "./util/redis";

const SESSION_TTL_SECONDS = 60 * 60 * 4; // 4 hours

const SESSION_BOOLEAN_DEFAULTS = {
  hasBackup: false,
  exportedRepo: false,
  importedRepo: false,
  exportedBlobs: false,
  importedBlobs: false,
  migratedPrefs: false,
  requestedPlcToken: false,
  originDeactivated: false,
  destActivated: false,
  migratedPlc: false,
  require_2fa_code: false,
} as const;

export type BlobJobProgress = {
  invalid_blobs: number;
  successful_blobs: number;
  total: number;
};

export type SessionData = {
  do_journey?: "create" | "migrate" | "resume" | "fail";
  handle_origin?: string;
  handle_dest?: string;
  password_origin?: string;
  pds_dest?: string;
  did_exists_in_dest?: boolean;
  atp_origin_session?: AtpSessionData;
  atp_dest_session?: AtpSessionData;
  pds_origin?: string;
  token_origin?: string;
  token_dest?: string;
  token_ref_origin?: string;
  token_ref_dest?: string;
  plc_hostname?: string;
  did?: string;
  inviteCode?: string;
  email?: string;
  user_recover_key?: string | null;
  export_progress?: BlobJobProgress | null;
  upload_progress?: BlobJobProgress | null;
  export_job_id?: string | null;
  import_job_id?: string | null;
  export_job_failures?: number;
  import_job_failures?: number;
  last_export_check?: number;
  last_import_check?: number;
  handle_not_available?: boolean | null;
  password_mismatch?: boolean | null;
  password_too_short?: boolean | null;

  // state flags, set a default on the object above when
  // adding new ones
  hasBackup: boolean;
  exportedRepo: boolean;
  importedRepo: boolean;
  exportedBlobs: boolean;
  importedBlobs: boolean;
  migratedPrefs: boolean;
  requestedPlcToken: boolean;
  originDeactivated: boolean;
  destActivated: boolean;
  migratedPlc: boolean;
  require_2fa_code: boolean;
};

export type ErrorType = "Expected" | "Unexpected";

export type SessionFlashData = {
  error?: string;
  errorType?: ErrorType;
};

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
          ...SESSION_BOOLEAN_DEFAULTS,
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

function computeTtlSeconds(
  expires: Date | number | undefined,
  fallbackSeconds: number
): number {
  if (!expires) return fallbackSeconds;

  if (typeof expires === "number") return Math.max(1, Math.floor(expires / 1000));

  const ms = expires.getTime() - Date.now();
  return Math.max(1, Math.floor(ms / 1000));
}

export const { getSession, commitSession, destroySession } = initSession();
