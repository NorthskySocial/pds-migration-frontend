import { createCookieSessionStorage } from "react-router";
import type {AtpSessionData} from "@atproto/api/src/types";

export type SessionData = {
  do_journey?: "create" | "migrate" | "resume" | "fail";
  handle_origin?: string;
  handle_dest?: string;
  password_origin?: string;
  pds_dest?: string;
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
  export_progress?: {
    invalid_blob_ids: string[];
    invalid_blobs: number;
    successful_blobs: number;
    successful_blobs_ids: string[];
    total: number;
  } | null;
  export_job_id?: string | null;
  export_total?: number | null;
  export_pct_done?: string | null;
  last_export_check?: number;
  handle_not_available?: boolean | null;
  password_mismatch?: boolean | null;
  password_too_short?: boolean | null;

  // state flags
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

export type SessionFlashData = {
  error?: string;
};

export const initSession = (hostname?: string) =>
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",

      // all of these are optional
      domain: hostname, // @TODO get from context
      // Expires can also be set (although maxAge overrides it when used in combination).
      // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
      //
      // expires: new Date(Date.now() + 60_000),
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "strict",
      secrets: ["toastytoast"],
      secure: true,
    },
  });

export const { getSession, commitSession, destroySession } = initSession();
