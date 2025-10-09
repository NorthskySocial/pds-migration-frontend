"use server";

import { AtpAgent } from "@atproto/api";
import {
  getPdsEndpoint,
  isValidDidDoc,
  type DidDocument,
} from "@atproto/common-web";

import { type SessionData } from "~/sessions.server";
import {
  CreateAccountError,
  LoginError,
  MigrationError,
  PasswordValidationError,
} from "~/errors";
import { logger } from "~/util/logger";
import f from "~/util/mock-fetch";

export async function loginOrigin(
  { plc_hostname, pds_dest }: SessionData,
  data: FormData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
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
  //Save origin user name and password for later

  // Login to origin PDS
  const { data: agentSessionData } = await origin_agent.login({
    identifier: handle_origin,
    password
  });

  const { did, email, accessJwt: token_origin } = agentSessionData;

  if (!did) {
    throw new LoginError("Unable to resolve DID");
  }

  // Do we need to do this? Is DidDoc always returned when logging in??
  const didDoc: DidDocument = await (await f(`${plc_hostname}/${did}`)).json();

  logger.debug(didDoc);

  if (!didDoc || !isValidDidDoc(didDoc)) {
    throw new LoginError("Invalid DID Doc");
  }

  const serviceEndpoint = getPdsEndpoint(didDoc) ?? pds_origin;

  const pds_dest_hostname = new URL(pds_dest!).host;
  const aud = `did:web:${pds_dest_hostname.match("localhost") ? "localhost" : pds_dest_hostname
    }`;

  logger.debug({ aud });

  // Generate service token
  const res = await f(`${MIGRATOR_BACKEND}/service-auth`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "post",
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
  }

  const token_service = (await res.json()) as string;

  return {
    did,
    pds_origin,
    token_service,
    handle_origin,
    password_origin,
    token_origin,
    email,
    serviceEndpoint,
  };
}

export async function createDestAccount(
  {
    did,
    token_service,
    handle_origin,
    password_origin,
    pds_origin,
    pds_dest,
    email,
    inviteCode,
    user_recover_key,
  }: Partial<SessionData>,
  data: FormData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  const pw_dest = (data.get("password") as string) ?? "";
  const pwConfirm = (data.get("password-confirm") as string) ?? "";
  const handle = ((data.get("handle") as string) ?? "").toLowerCase();
  const submitted = data.has("submit");
  const dest_hostname = new URL(pds_dest!).host;
  const handle_dest = `${handle}.${dest_hostname.match("localhost") ? "test" : dest_hostname
    }`;
  const org_hostname = new URL(pds_origin!).host;
  const handle_org = `${handle_origin}.${org_hostname.match("localhost") ? "test" : org_hostname
    }`;
  const pw_org = password_origin as string;

  // Check passwords matching
  if (pw_dest !== pwConfirm && pw_dest.length && pwConfirm.length) {
    throw new PasswordValidationError("Passwords do not match");
  }

  // Check password length
  if (pw_dest?.length < 8 && pw_dest.length > 0) {
    throw new PasswordValidationError("Password must be at least 8 characters");
  }

  // Check handle availability
  if (!handle.length) {
    return { handle_available: null, token_dest: null };
  } else {

    //debug
    console.log("Handle available " + `${pds_dest}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_dest}`);

    const handle_available = await f(
      `${pds_dest}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_dest}`
    )
      .then<{ message: string; error: string } & { did: string }>((r) =>
        r.json()
      )
      .then((d) => d.message === "Unable to resolve handle" || d.did === did);

    if (!submitted) return { handle_available, handle_dest };

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

      return { token_dest: response.data.accessJwt };

    } else {
      //This is a migrated account

      // Login to origin PDS

      console.error("Org Hostname: "+ org_hostname);
      console.error("Migrator backend: "+ MIGRATOR_BACKEND);

      const origin_agent = new AtpAgent({
        service: org_hostname,
        fetch: f as typeof fetch,
      });

      const { data: agentSessionData } = await origin_agent.login({
        identifier: handle_org,
        password: pw_org,
      });

      const body = {
        pds_host: pds_dest,
        handle: handle_dest,
        token: token_service,
        password: pw_dest,
        email,
        did,
        invite_code: inviteCode,
        recovery_key: user_recover_key,
      };



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

      // if (!createAccountRes.ok) {
      //   throw new CreateAccountError(createAccountRes.statusText);
      // }

      // Get new user token
      const agent_dest = new AtpAgent({
        service: pds_dest!,
        fetch: f as typeof fetch,
      });

      const { data } = await agent_dest.login({
        identifier: handle_dest,
        password: pw_dest,
      });

      return { token_dest: data.accessJwt };
    }
  }
}

export async function exportRepo(
  { pds_origin, did, token_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (!pds_origin || !did || !token_origin) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  // export repo

  const res = await f(`${MIGRATOR_BACKEND}/export-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_origin,
      did,
      token: token_origin,
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
  { pds_dest, did, token_dest }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  // This breaks during local tests so return early if Vite in dev mode
  if (import.meta.env.DEV) {
    logger.log("Ignoring importRepo during tests");
    return { ok: true };
  }

  if (!pds_dest || !did || !token_dest) {
    throw new MigrationError(
      "Unable to resolve new account; please contact support."
    );
  }

  // import repo
  const res = await f(`${MIGRATOR_BACKEND}/import-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_dest,
      did,
      token: token_dest,
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
  { pds_origin, pds_dest, did, token_dest, token_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (![pds_origin, pds_dest, did, token_dest, token_origin].every((i) => i)) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
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
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return { ok: true };
}

export async function uploadBlobs(
  { pds_dest, did, token_dest }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (import.meta.env.DEV) {
    logger.log("Not uploading blobs because this is a test");
    return { ok: true };
  }
  if (!pds_dest || !did || !token_dest) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  // upload blobs
  const res = await f(`${MIGRATOR_BACKEND}/upload-blobs`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_dest,
      did,
      token: token_dest,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return { ok: true };
}

export async function migratePreferences(
  { pds_origin, pds_dest, did, token_dest, token_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (!pds_origin || !pds_dest || !did || !token_dest || !token_origin) {
    throw new MigrationError("Not able to migrate preferences");
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
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return { ok: true };
}

export async function requestPlcToken(
  { pds_origin, did, token_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
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
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }

  return { ok: true };
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
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
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
        token: token_dest,
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
        token: token_origin,
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
