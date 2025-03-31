import { createCookieSessionStorage } from "react-router";

type SessionData = {
  handle_origin: string;
  handle_dest: string;
  pds_dest: string;
  pds_origin: string;
  token_origin: string;
  token_dest: string;
  token_plc: string;
  token_service: string;
  plc_hostname: string;
  did: string;
  inviteCode?: string;
  email: string;
};

type SessionFlashData = {
  error: string;
  progress?: {
    stageTitle: string;
    stageDescription: string;
    stageIdx: number;
  };
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",

      // all of these are optional
      domain: import.meta.env.PDS_HOSTNAME ?? "localhost",
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

export { getSession, commitSession, destroySession };
