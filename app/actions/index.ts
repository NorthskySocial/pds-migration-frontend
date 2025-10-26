"use server";

import { AtpAgent, } from "@atproto/api";
import { type AtpSessionData, type AtpSessionEvent } from "@atproto/api";

import {
  getPdsEndpoint,
  isValidDidDoc,
  type DidDocument,
} from "@atproto/common-web";

import {type SessionData, type SessionFlashData} from "~/sessions.server";
import {
  CreateAccountError,
  HandleNotAvailableError,
  LoginError,
  MigrationError,
  PasswordValidationError,
} from "~/errors";
import {logger} from "~/util/logger";
import f from "~/util/mock-fetch";
import { useFetcher } from "react-router";
import { useState } from "react";
import type { Session } from "react-router";
import type { type } from "os";

export async function loginOrigin(
  session: Session<SessionData, SessionFlashData>,
  data: FormData,
  env: CloudflareEnvironment
) {
  const pds_origin = (data.get("pds") as string) ?? "https://bsky.social";

  const origin_agent = new AtpAgent({
    service: pds_origin,
    fetch: f as typeof fetch,
  });

  const handle_origin = data.get("bsky-handle") as string;

  if (!handle_origin) {
    throw new LoginError("Invalid handle");
  }

  const password = (data.get("bsky-password") as string) ?? "";

  if (!password) {
    throw new LoginError("Invalid password");
  }

  const password_origin = password;

  //Save origin, user name and password for later
  session.set("handle_origin", handle_origin);
  session.set("password_origin", password_origin);
  session.set("pds_origin", pds_origin);


  // Login to origin PDS
  const {data: agentSessionData} = await origin_agent.login({
    identifier: handle_origin,
    password,
    authFactorToken: (data.get("2fa_code") as string) ?? undefined,
  });

  console.log("Agent Sesson Data " + agentSessionData);

  const { did, email, accessJwt: token_origin, refreshJwt: token_ref_origin } = agentSessionData;

  if (!did) {
    throw new LoginError("Unable to resolve DID");
  }

  return {
    did,
    pds_origin,
    handle_origin,
    password_origin,
    token_origin,
    token_ref_origin,
    email,
  };
}

//Create an account on the Northsky PDS
export async function createDestAccount(
  {

    did,
    token_origin,
    token_ref_origin,
    handle_origin,
    pds_origin,
    pds_dest,
    email,
    inviteCode,
    user_recover_key,
    password_too_short = false,
    password_match = false,
    handle_available,
    email_valid,

  }: Partial<SessionData>,
  data: FormData,
  {MIGRATOR_BACKEND}: CloudflareEnvironment
) {
  if (pds_origin === undefined) {
    console.error("pds_origin is undefined");
    throw new CreateAccountError("Invalid origin PDS");
  }
  if (pds_dest === undefined) {
    console.error("pds_dest is undefined");
    throw new CreateAccountError("Invalid destination PDS");
  }
  if (email === undefined) {
    console.error("email is undefined");
    throw new CreateAccountError("Invalid email");
  }
  if (token_origin === undefined) {
    console.error("token_origin is undefined");
    throw new CreateAccountError("Invalid origin token");
  }

  const pw_dest = (data.get("password") as string) ?? "";
  const pwConfirm = (data.get("password-confirm") as string) ?? "";
  const handle = ((data.get("handle") as string) ?? "").toLowerCase();
  const submitted = data.has("submit");
  const dest_hostname = new URL(pds_dest!).host;
  const handle_dest = `${handle}.${dest_hostname.match("localhost") ? "test" : dest_hostname

    }`;

  //Do sanity check on the fields.

  // Check e-mail is in a good format
  //say yes for now
  email_valid = true;

  // Check passwords matching
  password_match = (pw_dest === pwConfirm);

  // Check password length
  // console.log("Password :",pw_dest, (pw_dest.length < 8),pw_dest.length > 0,(pw_dest.length < 8 && pw_dest.length > 0));
  password_too_short = (pw_dest.length < 8 && pw_dest.length > 0);

  // Check handle availability
  if (!handle.length) {
    return {handle_available: null, token_dest: null};
  } else {

    //debug
    console.log(
      "Handle available " +
      `${pds_dest}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_dest}`
    );


    const handle_available = await f(
      `${pds_dest}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_dest}`
    )
      .then<{ message: string; error: string } & { did: string }>((r) =>
        r.json()
      )
      .then((d) => d.message === "Unable to resolve handle" || d.did === did);

    // console.log("Handle available: " + handle_available);
    // console.log("Handle dest: " + handle_dest);
    // console.log("Submitted:" + submitted)

    if (!submitted) return { handle_dest_available: handle_available, handle_dest: handle_dest, email_valid: email_valid, password_match: password_match, password_too_short: password_too_short, agent_dest: null }

    else {

      //Disable checks if we're in dev mode
      if (import.meta.env.DEV) {
        logger.log("Skipping availability check");

        return { token_dest: "Test Token", handle_dest_available: handle_available, handle_dest: handle_dest, email_valid: email_valid, password_match: password_match, password_too_short: password_too_short, agent_dest: null };
      }

      // Create account directly if service token is not available
      // This is a new, non migrated account
      if (!did) {

        // Get new user token
        const agent_dest = new AtpAgent({
          service: pds_dest!,
          fetch: f as typeof fetch,
        });
        const response = await agent_dest.createAccount({
          email: email,
          handle: handle_dest,
          inviteCode: inviteCode,
          password: pw_dest,
        });

        if (!response.success) {
          logger.error(response.data);
          throw new CreateAccountError("error creating account");
        }

        return { handle_dest: handle_dest, token_dest: response.data.accessJwt, token_ref_dest: response.data.refreshJwt, agent_dest: agent_dest };

      }

      /* This is a migrated account */
      else {

        const serviceEndpoint = pds_origin;

        const pds_dest_hostname = new URL(pds_dest!).host;
        const aud = `did:web:${pds_dest_hostname.match("localhost") ? "localhost" : pds_dest_hostname
          }`;

        logger.debug({ aud });

        //refresh auth token
        const agent_origin = new AtpAgent({
          service: pds_origin!,
          fetch: f as typeof fetch,
        });

        console.log("Pre resume token " + token_ref_origin);


        const resume_promise = await agent_origin.resumeSession({
          handle: handle_origin || "",
          accessJwt: token_origin || "",
          refreshJwt: token_ref_origin || "",
          did: did,
          active: true,
        })

        if (resume_promise.success) {
          console.log("Resume successful. " + token_ref_origin);
        }

        else {
          console.log("Resume unsuccessful. " + token_ref_origin);
        }



        // Generate service token
        const res = await f(`${MIGRATOR_BACKEND}/service-auth`, {
          headers: {
            "Content-Type": "application/json",
          },
          method: "post",
          body: JSON.stringify({
            pds_host: serviceEndpoint,
            did,
            token: token_ref_origin,
            aud,
          }),
        });

        if (!res.ok) {
          throw new LoginError(
            `Invalid service token received; please contact support with error: ${res.statusText}`
          );
        }

        //creating the service token here
        const token_service = (await res.json()) as { token: string };

        const body = {
          pds_host: pds_dest,
          handle: handle_dest,

          token: token_service.token || '',
          password: pw_dest,
          email,
          did,
          invite_code: inviteCode,
          recovery_key: user_recover_key,
        };

        console.log("Stringified" + JSON.stringify(body));

        const createAccountRes = await f(`${MIGRATOR_BACKEND}/create-account`, {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        logger.debug("create account debugging", body, {
          headers: createAccountRes.headers,
          body: createAccountRes.body,
          ok: createAccountRes.ok,
          status: createAccountRes.status,
          statusText: createAccountRes.statusText,
          url: createAccountRes.url,
        });

        if (!createAccountRes.ok) {
          throw new CreateAccountError(createAccountRes.statusText);
        }

        // Get new user token
        const agent_dest = new AtpAgent({
          service: pds_dest!,
          fetch: f as typeof fetch,
        });

        const { data } = await agent_dest.login({
          identifier: handle_dest,
          password: pw_dest,
        });
        return { handle_dest: handle_dest, token_dest: data.accessJwt };
      }
    }
  }
}

export async function exportRepo(
  { pds_origin, did, token_origin, token_ref_origin, handle_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {

  //Disable checks if we're in dev mode
  if (import.meta.env.DEV) {
    return {ok: true};
  }


  if (!pds_origin || !did || !token_origin) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  //refresh auth token
  const agent_origin = new AtpAgent({
    service: pds_origin!,
    fetch: f as typeof fetch,
  });

  console.log("Pre resume token " + token_ref_origin);


  const resume_promise = await agent_origin.resumeSession({
    handle: handle_origin || "",
    accessJwt: token_origin || "",
    refreshJwt: token_ref_origin || "",
    did: did,
    active: true,
  })

  if (resume_promise.success) {
    console.log("Resume successful. " + token_ref_origin);
  }

  else {
    console.log("Resume unsuccessful. " + token_ref_origin);
  }

  // export repo

  const res = await f(`${MIGRATOR_BACKEND}/export-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_origin,
      did,
      token: token_origin,
    }),
    headers: {"Content-Type": "application/json"},
  });
  logger.debug("exportRepo", res);

  if (!res.ok) {
    throw new MigrationError(await res.text());
  }

  return {ok: true};
}

export async function importRepo(
  { pds_dest, did, token_dest, token_ref_dest, handle_dest }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  // This breaks during local tests so return early if Vite in dev mode
  if (import.meta.env.DEV) {
    logger.log("Ignoring importRepo during tests");
    return {ok: true};
  }

  if (!pds_dest || !did || !token_dest) {
    throw new MigrationError(
      "Unable to resolve new account; please contact support."
    );
  }

  //refresh auth token
  const agent_origin = new AtpAgent({
    service: pds_dest!,
    fetch: f as typeof fetch,
  });

  console.log("Pre resume token " + token_ref_dest);


  const resume_promise = await agent_origin.resumeSession({
    handle: handle_dest || "",
    accessJwt: token_dest || "",
    refreshJwt: token_ref_dest || "",
    did: did,
    active: true,
  })

  if (resume_promise.success) {
    console.log("Resume successful. " + token_ref_dest);
  }

  else {
    console.log("Resume unsuccessful. " + token_ref_dest);
  }



  // import repo
  const res = await f(`${MIGRATOR_BACKEND}/import-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_dest,
      did,
      token: token_dest,
    }),
    headers: {"Content-Type": "application/json"},
  });

  logger.debug("importRepo", res);

  if (!res.ok) {
    throw new MigrationError((await res?.text()) ?? "Unknown migration error");
  }

  return {ok: true};
}

export async function exportBlobs(
  { pds_origin, pds_dest, did, token_dest, token_origin, token_ref_dest, token_ref_origin,handle_dest, handle_origin}: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {

  //Disable checks if we're in dev mode
  if (import.meta.env.DEV) {
    return {ok: true};
  }

  if (![pds_origin, pds_dest, did, token_dest, token_origin].every((i) => i)) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  //refresh origin token
  const agent_origin = new AtpAgent({
    service: pds_origin!,
    fetch: f as typeof fetch,
  });

  console.log("Pre resume token " + token_ref_origin);


  const resume_org_promise = await agent_origin.resumeSession({
    handle: handle_origin || "",
    accessJwt: token_origin || "",
    refreshJwt: token_ref_origin || "",
    did: did  || "",
    active: true,
  })

  if (resume_org_promise.success) {
    console.log("Resume successful. " + token_ref_origin);
  }

  else {
    console.log("Resume unsuccessful. " + token_ref_origin);
  }

  //refresh dest token
  const agent_dest = new AtpAgent({
    service: pds_dest!,
    fetch: f as typeof fetch,
  });

  console.log("Pre resume token " + token_ref_dest);


  const resume_promise = await agent_dest.resumeSession({
    handle: handle_dest || "",
    accessJwt: token_dest || "",
    refreshJwt: token_ref_dest || "",
    did: did  || "",
    active: true,
  })

  if (resume_promise.success) {
    console.log("Resume successful. " + token_ref_dest);
  }

  else {
    console.log("Resume unsuccessful. " + token_ref_dest);
  }

  // missing blobs
  const res = await f(`${MIGRATOR_BACKEND}/export-blobs`, {
    method: "post",
    body: JSON.stringify({
      did,
      destination: pds_dest,
      destination_token: token_dest,
      origin: pds_origin,
      origin_token: token_origin,
    }),
    headers: {"Content-Type": "application/json"},
  });

  if (!res.ok) {
    let errorMessage: string;
    try {
      const errorData = await res.json<{ message: string }>();
      errorMessage = errorData.message;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (jsonError) {
      // If JSON parsing fails, try to get text content
      try {
        const textContent = await res.text();
        errorMessage = `Server error: ${textContent.substring(0, 200)}...`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (textError) {
        // If both fail, use the status information
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }
    }
    logger.error(`Export blobs failed: ${errorMessage}`)
    throw new MigrationError(errorMessage);
  }

  return {ok: true};
}

export async function uploadBlobs(
  { pds_dest, did, token_dest, token_ref_dest,handle_dest }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (import.meta.env.DEV) {
    logger.log("Not uploading blobs because this is a test");
    return {ok: true};
  }
  if (!pds_dest || !did || !token_dest) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }
  //refresh dest token
  const agent_dest = new AtpAgent({
    service: pds_dest!,
    fetch: f as typeof fetch,
  });

  console.log("Pre resume token " + token_ref_dest);


  const resume_promise = await agent_dest.resumeSession({
    handle: handle_dest || "",
    accessJwt: token_dest || "",
    refreshJwt: token_ref_dest || "",
    did: did  || "",
    active: true,
  })

  if (resume_promise.success) {
    console.log("Resume successful. " + token_ref_dest);
  }

  else {
    console.log("Resume unsuccessful. " + token_ref_dest);
  }
  // upload blobs
  const res = await f(`${MIGRATOR_BACKEND}/upload-blobs`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_dest,
      did,
      token: token_dest,
    }),
    headers: {"Content-Type": "application/json"},
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return {ok: true};
}

export async function migratePreferences(
  { pds_origin, pds_dest, did, token_dest, token_origin, token_ref_dest, token_ref_origin,handle_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {

  if (import.meta.env.DEV) {
    logger.log("Not uploading blobs because this is a test");
    return {ok: true};
  }

  if (!pds_origin || !pds_dest || !did || !token_dest || !token_origin) {
    throw new MigrationError("Not able to migrate preferences");
  }


  //refresh origin token
  const agent_origin = new AtpAgent({
    service: pds_origin!,
    fetch: f as typeof fetch,
  });

  console.log("Pre resume token " + token_ref_origin);


  const resume_org_promise = await agent_origin.resumeSession({
    handle: handle_origin || "",
    accessJwt: token_origin || "",
    refreshJwt: token_ref_origin || "",
    did: did  || "",
    active: true,
  })

  if (resume_org_promise.success) {
    console.log("Resume successful. " + token_ref_origin);
  }

  else {
    console.log("Resume unsuccessful. " + token_ref_origin);
  }

  // migrate preferences
  const res = await f(`${MIGRATOR_BACKEND}/migrate-preferences`, {
    method: "post",
    body: JSON.stringify({
      did,
      destination: pds_dest,
      destination_token: token_dest,
      origin: pds_origin,
      origin_token: token_origin,
    }),
    headers: {"Content-Type": "application/json"},
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return {ok: true};
}

export async function requestPlcToken(
  {pds_origin, did, token_origin}: SessionData,
  {MIGRATOR_BACKEND}: CloudflareEnvironment
) {

  if (import.meta.env.DEV) {
    logger.log("Skipping PLC because we're testing");
    return {ok: true};
  }
  if (!pds_origin || !did || !token_origin) {
    throw new MigrationError(
      "Not able to request PLC token due to invalid credentials"
    );
  }
  // req PLC token
  const res = await f(`${MIGRATOR_BACKEND}/request-token`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_origin,
      did,
      token: token_origin,
    }),
    headers: {"Content-Type": "application/json"},
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return {ok: true};
}

export async function validatePlcToken(
  {
    pds_dest,
    did,
    token_dest,
    pds_origin,
    token_origin,
    user_recover_key,
  }: SessionData,
  data: FormData,
  {MIGRATOR_BACKEND}: CloudflareEnvironment
) {

  if (import.meta.env.DEV) {
    logger.log("Skipping PlcToken");
    return {ok: true};
  }
  const submitted = data.has("submit");
  const plcToken = data.get("token_plc") as string;

  if (submitted && plcToken) {
    const payload = {
      destination: pds_dest,
      destination_token: token_dest,
      origin: pds_origin,
      did,
      origin_token: token_origin,
      plc_signing_token: plcToken,
      user_recover_key: user_recover_key ?? undefined,
    };

    // migrate PLC
    const migrateRes = await f(`${MIGRATOR_BACKEND}/migrate-plc`, {
      method: "post",
      body: JSON.stringify(payload),
      headers: {"Content-Type": "application/json"},
    });

    if (!migrateRes.ok) {
      throw new MigrationError(
        (await migrateRes.json<{ message: string }>())?.message ??
        migrateRes.statusText
      );
    }

    // activate new account
    const activateRes = await f(`${MIGRATOR_BACKEND}/activate-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: pds_dest,
        did,
        token: token_dest,
      }),
      headers: {"Content-Type": "application/json"},
    });

    if (!activateRes.ok) {
      throw new MigrationError(
        (await activateRes.json<{ message: string }>())?.message ??
        activateRes.statusText
      );
    }

    // deactivate old account
    const deactivateRes = await f(`${MIGRATOR_BACKEND}/deactivate-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: pds_origin,
        did,
        token: token_origin,
      }),
      headers: {"Content-Type": "application/json"},
    });

    if (!deactivateRes.ok) {
      throw new MigrationError(
        (await deactivateRes.json<{ message: string }>())?.message ??
        deactivateRes.statusText
      );
    }

    return {ok: true};
  }

  return {ok: false};
}
