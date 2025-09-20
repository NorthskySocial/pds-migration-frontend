import { createCookieSessionStorage } from "react-router";

export type SessionData = {
  do_journey?: "create" | "migrate";
  handle_origin?: string;
  handle_dest?: string;
  pds_dest?: string;
  pds_origin?: string;
  token_origin?: string;
  token_dest?: string;
  token_service?: string;
  plc_hostname?: string;
  did?: string;
  inviteCode?: string;
  email?: string;
  user_recover_key?: string | null;

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
};

export type SessionFlashData = {
  error: string;
  progress?: {
    stageTitle: string;
    stageDescription: string;
  };
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
      maxAge: 60,
      path: "/",
      sameSite: "strict",
      secrets: ["s3cret1"],
      secure: true,
    },
  });

export const { getSession, commitSession, destroySession } = initSession();
