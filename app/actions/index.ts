"use server";

import { AtpAgent } from "@atproto/api";

import { type SessionData } from "~/sessions.server";
import { CreateAccountError, LoginError, MigrationError } from "~/errors";
import { logger } from "~/util/logger";
import f from "~/util/mock-fetch";
import type { AtpSessionData } from "@atproto/api/src/types";

/**
 * Resume AtpAgent's session. Automatically refreshes the session if needed.
 * @param pds_dest
 * @param atp_dest_session
 * @param pds_origin
 * @param atp_origin_session
 * These flags are here to save the need to resume if not needed since it does a web request. Saves a bit of time
 * @param destination Resume the destination agent if true. Defaults to true.
 * @param origin Resume the origin agent if true. Defaults to true.
 */
async function refreshAgents(
  pds_dest?: string,
  atp_dest_session?: AtpSessionData,
  pds_origin?: string,
  atp_origin_session?: AtpSessionData,
  destination = true,
  origin = true
) {
  if (!pds_dest || !pds_origin || !atp_dest_session || !atp_origin_session) {
    console.error("refreshAgents is missing required params");
    throw new MigrationError("Unable to resume session . Please re login");
  }

  let destResumeAgent: AtpAgent | null = null;
  let originResumeAgent: AtpAgent | null = null;

  if (destination) {
    //Resume destination agent session

    if (!pds_dest || !atp_dest_session)
      throw new MigrationError("Unable to resume session . Please re login");

    destResumeAgent = new AtpAgent({
      service: pds_dest,
    });
    //this will automatically check the session and refresh if needed
    const { success } = await destResumeAgent.resumeSession(atp_dest_session);
    if (!success)
      throw new MigrationError("Unable to resume session. Please re login");
  }

  if (origin) {
    //Resume origin agent session
    if (!pds_origin || !atp_origin_session)
      throw new MigrationError("Unable to resume session . Please re login");

    originResumeAgent = new AtpAgent({
      service: pds_origin,
    });
    //this will automatically check the session and refresh if needed
    const { success } =
      await originResumeAgent.resumeSession(atp_origin_session);
    if (!success)
      throw new MigrationError("Unable to resume session. Please re login");
  }

  return { destResumeAgent, originResumeAgent };
}

export async function loginOrigin({
  pds_origin,
  handle_origin,
  password_origin,
  authFactorToken,
}: {
  pds_origin: string;
  handle_origin?: string;
  password_origin?: string;
  authFactorToken?: string;
}) {
  const origin_agent = new AtpAgent({
    service: pds_origin,
    fetch: f as typeof fetch,
  });

  if (!handle_origin) {
    throw new LoginError("Invalid handle");
  }

  if (!password_origin) {
    throw new LoginError("Invalid password");
  }

  // Login to origin PDS
  const { data: agentSessionData } = await origin_agent.login({
    identifier: handle_origin,
    password: password_origin,
    authFactorToken,
  });

  const { did, email, accessJwt: token_origin } = agentSessionData;

  if (!did) {
    throw new LoginError("Unable to resolve DID");
  }

  return {
    did,
    pds_origin,
    handle_origin,
    password_origin,
    token_origin,
    email,
    atp_origin_session: origin_agent.session,
  };
}

export async function createDestAccount(
  {
    did,
    token_origin,
    pds_origin,
    pds_dest,
    email,
    inviteCode,
    user_recover_key,
  }: Partial<SessionData>,
  data: FormData,
  MIGRATOR_BACKEND: string,
  is_creation_flow: boolean
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
  if (!is_creation_flow && token_origin === undefined) {
    console.error("token_origin is undefined");
    throw new CreateAccountError("Invalid origin token");
  }

  console.log("In creation");
  const pw_dest = (data.get("password") as string) ?? "";
  const pwConfirm = (data.get("password-confirm") as string) ?? "";
  const handle = ((data.get("handle") as string) ?? "").toLowerCase();
  const submitted = data.has("submit");
  const dest_hostname = new URL(pds_dest!).host;
  const handle_dest = `${handle}.${
    dest_hostname.match("localhost") ? "test" : dest_hostname
  }`;
  let handleIsAvailable = null;
  let passwordMismatch = null;
  let passwordTooShort = null;
  let nsToken = "";

  // Check passwords matching
  if (pw_dest !== pwConfirm && pw_dest.length && pwConfirm.length) {
    passwordMismatch = true;
    console.log("Password mismatch");
  } else {
    passwordMismatch = false;
  }

  // Check password length
  if (pw_dest?.length < 8 && pw_dest.length > 0) {
    passwordTooShort = true;
    console.log("Password too short");
  } else if (pw_dest.length > 0) {
    passwordTooShort = false;
  }

  // Check handle availability
  if (!handle_dest.length) {
    handleIsAvailable = null;
  } else {
    console.log("Checking handle " + handle_dest);
    handleIsAvailable = await f(
      `${pds_dest}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_dest}`
    )
      .then<{ message: string; error: string } & { did: string }>((r) =>
        r.json()
      )
      .then((d) => d.message === "Unable to resolve handle" || d.did === did)
      .catch((e) => {
        console.error(e);
        return e.message === "Unable to resolve handle" || e.did === did;
      });

    console.log(`Handle ${handle_dest} available? ` + handleIsAvailable);
  }

  // Return early if the user hasn't clicked submit
  // Or if password/handle validation fails
  // This is to handle user feedback for e.g. password length/check and handle availability
  if (
    !submitted ||
    !handleIsAvailable ||
    passwordTooShort ||
    passwordMismatch
  ) {
    return {
      handle_not_available: !handleIsAvailable,
      handle_dest: handle_dest,
      passwordTooShort: passwordTooShort,
      passwordMismatch: passwordMismatch,
    };
  }

  // Create account directly if service token is not available
  // This is a new, non migrated account
  if (!did) {
    // Get new user token
    const agent_dest = new AtpAgent({
      service: pds_dest,
      fetch: f as typeof fetch,
    });
    const response = await agent_dest.createAccount({
      email: email,
      handle: handle_dest,
      inviteCode: inviteCode,
      password: pw_dest,
    });

    if (!response.success) {
      throw new CreateAccountError("Error creating account on destination PDS");
    } else {
      console.log("New dest account created successfully");
    }

    const { data } = await agent_dest.login({
      identifier: handle_dest,
      password: pw_dest,
    });


    return {
      token_dest: data.accessJwt,
      handle_dest: handle_dest,
      handle_not_available: !handleIsAvailable,
      passwordTooShort: passwordTooShort,
      passwordMismatch: passwordMismatch,
      //Not 100% sure if we do need to save the session since it's a new account. Not sure if theres more actions needed
      atp_dest_session: agent_dest.session,
    };
  } else {
    /* This is a migrated account */

    const serviceEndpoint: string = pds_origin;

    const pds_dest_hostname: string = new URL(pds_dest!).host;
    const aud = `did:web:${pds_dest_hostname.match("localhost") ? "localhost" : pds_dest_hostname}`;

    // Generate service token
    console.log("Requesting service token");
    const res = await f(`${MIGRATOR_BACKEND}/service-auth`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        pds_host: serviceEndpoint,
        did,
        token: token_origin,
        aud,
      }),
    });


    if (!res.ok) {
      throw new LoginError(
        `Invalid service token received; please contact support with error: ${res.statusText}`
      );
    } else {
      console.log("Service token received successfully!");
    }

    const token_service = await res.json<{ token: string }>();
    console.log("Service token parsed successfully!");

    if (!token_service.token) {
      throw new LoginError(
        `Invalid service token received; please contact support with error: ${res.statusText}`
      );
    }

    const createAccountRequestBody = {
      pds_host: pds_dest,
      handle: handle_dest,
      token: token_service.token,
      password: pw_dest,
      email,
      did,
      invite_code: inviteCode,
      recovery_key: user_recover_key,
    };

    console.log("Creating migrated account...");
    const createAccountRes = await f(`${MIGRATOR_BACKEND}/create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createAccountRequestBody),
    });
    console.log("Migrated account creation status: ", createAccountRes.status);

    if (!createAccountRes.ok) {
      throw new CreateAccountError(createAccountRes.statusText);
    }

    // Get new user token
    const agent_dest = new AtpAgent({
      service: pds_dest!,
      fetch: f as typeof fetch,
    });

    console.log("Logging into migrated account...");
    const { data: destLoginData } = await agent_dest.login({
      identifier: handle_dest,
      password: pw_dest,
    });
    console.log("Logged into migrated account successfully!");

    nsToken = destLoginData.accessJwt;

    return {
      token_dest: nsToken,
      handle_dest: handle_dest,
      handle_not_available: !handleIsAvailable,
      passwordTooShort: passwordTooShort,
      passwordMismatch: passwordMismatch,
      atp_dest_session: agent_dest.session,
    };
  }
}

export async function exportRepo(
  {
    pds_origin,
    did,
    pds_dest,
    atp_dest_session,
    atp_origin_session,
  }: SessionData,
  MIGRATOR_BACKEND: string
) {
  // //Disable checks if we're in dev mode
  // if (import.meta.env.DEV) {
  //   return { ok: true };
  // }

  if (!pds_origin || !did) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  const { originResumeAgent } = await refreshAgents(
    pds_dest,
    atp_dest_session,
    pds_origin,
    atp_origin_session,
    false
  );

  // export repo
  const res = await f(`${MIGRATOR_BACKEND}/export-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_origin,
      did,
      token: originResumeAgent?.session?.accessJwt,
    }),
    headers: { "Content-Type": "application/json" },
  });
  logger.debug("exportRepo", res);

  if (!res.ok) {
    throw new MigrationError(await res.text());
  }

  return { ok: true };
}

export async function importRepo(
  {
    pds_dest,
    did,
    atp_dest_session,
    atp_origin_session,
    pds_origin,
  }: SessionData,
  MIGRATOR_BACKEND: string
) {
  // // This breaks during local tests so return early if Vite in dev mode
  // if (import.meta.env.DEV) {
  //   logger.log("Ignoring importRepo during tests");
  //   return { ok: true };
  // }

  if (!pds_dest || !did) {
    throw new MigrationError(
      "Unable to resolve new account; please contact support."
    );
  }

  const { destResumeAgent } = await refreshAgents(
    pds_dest,
    atp_dest_session,
    pds_origin,
    atp_origin_session,
    true,
    false
  );

  // import repo
  const res = await f(`${MIGRATOR_BACKEND}/import-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_dest,
      did,
      token: destResumeAgent?.session?.accessJwt,
    }),
    headers: { "Content-Type": "application/json" },
  });

  logger.debug("importRepo", res);

  if (!res.ok) {
    throw new MigrationError((await res?.text()) ?? "Unknown migration error");
  }

  return { ok: true };
}

export async function exportBlobs(
  {
    pds_origin,
    pds_dest,
    did,
    atp_dest_session,
    atp_origin_session,
  }: SessionData,
  MIGRATOR_BACKEND: string
) {
  // //Disable checks if we're in dev mode
  // if (import.meta.env.DEV) {
  //   return { ok: true };
  // }

  if (!pds_origin || !pds_dest || !did) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  const { destResumeAgent, originResumeAgent } = await refreshAgents(
    pds_dest,
    atp_dest_session,
    pds_origin,
    atp_origin_session
  );

  try {
    const res = await f(`${MIGRATOR_BACKEND}/jobs/export-blobs`, {
      method: "post",
      body: JSON.stringify({
        did,
        destination: pds_dest,
        destination_token: destResumeAgent?.session?.accessJwt,
        origin: pds_origin,
        origin_token: originResumeAgent?.session?.accessJwt,
      }),
      headers: { "Content-Type": "application/json" },
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
      logger.error(`Export blobs failed: ${errorMessage}`);
      throw new MigrationError(errorMessage);
    }

    const { job_id } = await res.json<{ job_id: string }>();

    return { job_id };
  } catch (e) {
    console.error(e);
  }
}

export async function uploadBlobs(
  {
    pds_dest,
    did,
    atp_dest_session,
    atp_origin_session,
    pds_origin,
  }: SessionData,
  MIGRATOR_BACKEND: string
) {
  // if (import.meta.env.DEV) {
  //   logger.log("Not uploading blobs because this is a test");
  //   return { ok: true };
  // }
  if (!pds_dest || !did) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  const { destResumeAgent } = await refreshAgents(
    pds_dest,
    atp_dest_session,
    pds_origin,
    atp_origin_session,
    true,
    false
  );

  // upload blobs
  const res = await f(`${MIGRATOR_BACKEND}/upload-blobs`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_dest,
      did,
      token: destResumeAgent?.session?.accessJwt,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return { ok: true };
}

export async function migratePreferences(
  {
    pds_origin,
    pds_dest,
    did,
    atp_dest_session,
    atp_origin_session,
  }: SessionData,
  MIGRATOR_BACKEND: string
) {
  // if (import.meta.env.DEV) {
  //   logger.log("Not uploading blobs because this is a test");
  //   return { ok: true };
  // }

  if (!pds_origin || !pds_dest || !did) {
    throw new MigrationError("Not able to migrate preferences");
  }

  const { destResumeAgent, originResumeAgent } = await refreshAgents(
    pds_dest,
    atp_dest_session,
    pds_origin,
    atp_origin_session
  );

  // migrate preferences
  const res = await f(`${MIGRATOR_BACKEND}/migrate-preferences`, {
    method: "post",
    body: JSON.stringify({
      did,
      destination: pds_dest,
      destination_token: destResumeAgent?.session?.accessJwt,
      origin: pds_origin,
      origin_token: originResumeAgent?.session?.accessJwt,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return { ok: true };
}

export async function requestPlcToken(
  {
    pds_origin,
    did,
    pds_dest,
    atp_dest_session,
    atp_origin_session,
  }: SessionData,
  MIGRATOR_BACKEND: string
) {
  // if (import.meta.env.DEV) {
  //   logger.log("Skipping PLC because we're testing");
  //   return { ok: true };
  // }
  if (!pds_origin || !did) {
    throw new MigrationError(
      "Not able to request PLC token due to invalid credentials"
    );
  }
  const { originResumeAgent } = await refreshAgents(
    pds_dest,
    atp_dest_session,
    pds_origin,
    atp_origin_session,
    false,
    false
  );

  // req PLC token
  const body = JSON.stringify({
      pds_host: pds_origin,
      did,
      token: originResumeAgent?.session?.accessJwt,
  });
  // NOTE: temporary log to debug issue with PLC token request
  console.log("Requesting PLC token - token in body?: ", !!originResumeAgent?.session?.accessJwt);
  const res = await f(`${MIGRATOR_BACKEND}/request-token`, {
    method: "post",
    body: body,
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return { ok: true };
}

export async function resumeMigration({
  pds_dest,
  handle_dest,
  password_dest,
}: {
  pds_dest: string;
  handle_dest?: string;
  password_dest?: string;
}) {
  const dest_agent = new AtpAgent({
    service: pds_dest,
    fetch: f as typeof fetch,
  });

  if (!handle_dest) {
    throw new LoginError("Invalid Northsky handle");
  }

  if (!password_dest) {
    throw new LoginError("Invalid Northsky password");
  }

  // Login to origin PDS
  const { data: agentSessionData } = await dest_agent.login({
    identifier: handle_dest,
    password: password_dest,
  });

  const { accessJwt: token_dest } = agentSessionData;

  if (!token_dest) {
    throw new LoginError("Unable to login to Northsky");
  }

  return {
    token_dest,
    atp_dest_session: dest_agent.session,
  };
}

export async function validatePlcToken(
  {
    pds_dest,
    did,
    pds_origin,
    user_recover_key,
    atp_dest_session,
    atp_origin_session,
  }: SessionData,
  data: FormData,
  MIGRATOR_BACKEND: string
) {
  if (import.meta.env.DEV) {
    logger.log("Skipping PlcToken");
    return { ok: true };
  }
  const submitted = data.has("submit");
  const plcToken = data.get("token_plc") as string;

  if (submitted && plcToken) {
    const { destResumeAgent, originResumeAgent } = await refreshAgents(
      pds_dest,
      atp_dest_session,
      pds_origin,
      atp_origin_session
    );

    const payload = {
      destination: pds_dest,
      destination_token: destResumeAgent?.session?.accessJwt,
      origin: pds_origin,
      did,
      origin_token: originResumeAgent?.session?.accessJwt,
      plc_signing_token: plcToken,
      user_recover_key: user_recover_key ?? undefined,
    };

    // migrate PLC
    const migrateRes = await f(`${MIGRATOR_BACKEND}/migrate-plc`, {
      method: "post",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
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
        token: destResumeAgent?.session?.accessJwt,
      }),
      headers: { "Content-Type": "application/json" },
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
        token: originResumeAgent?.session?.accessJwt,
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (!deactivateRes.ok) {
      throw new MigrationError(
        (await deactivateRes.json<{ message: string }>())?.message ??
          deactivateRes.statusText
      );
    }

    return { ok: true };
  }

  return { ok: false };
}
