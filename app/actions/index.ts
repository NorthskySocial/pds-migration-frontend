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

export async function loginOrigin(
  { pds_origin, handle_origin, plc_hostname, pds_dest }: SessionData,
  data: FormData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  const origin_agent = new AtpAgent({ service: pds_origin! });
  const password = (data.get("password") as string) ?? "";

  // Login to origin PDS
  const { data: agentSessionData } = await origin_agent.login({
    identifier: handle_origin!,
    password,
  });

  const { did, email, accessJwt: token_origin } = agentSessionData;

  if (!did) {
    throw new LoginError("Unable to resolve DID");
  }

  const didDoc: DidDocument = await (
    await fetch(`${plc_hostname}/${did}`)
  ).json();

  if (!didDoc || !isValidDidDoc(didDoc)) {
    throw new LoginError("Invalid DID Doc");
  }

  const serviceEndpoint = getPdsEndpoint(didDoc) ?? pds_origin;

  const pds_dest_uri = new URL(pds_dest!);
  const aud = `did:web:${pds_dest_uri.host}`;

  // Generate service token
  const res = await fetch(`${MIGRATOR_BACKEND}/service-auth`, {
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
    token_origin,
    email,
    serviceEndpoint,
  };
}

export async function createDestAccount(
  { did, token_service, pds_dest, email, inviteCode }: Partial<SessionData>,
  data: FormData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  const pw_dest = (data.get("password") as string) ?? "";
  const pwConfirm = (data.get("password-confirm") as string) ?? "";
  const handle = ((data.get("handle") as string) ?? "").toLowerCase();
  const submitted = data.has("submit");
  const dest_hostname = new URL(pds_dest!).host;
  const handle_dest = `${handle}.${dest_hostname}`;

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
    const handle_available = await fetch(
      `${pds_dest}/xrpc/com.atproto.identity.resolveHandle?handle=${handle_dest}`
    )
      .then<{ message: string; error: string } & { did: string }>((r) =>
        r.json()
      )
      .then((d) => d.message === "Unable to resolve handle" || d.did === did);

    if (!submitted) return { handle_available };

    const body = {
      pds_host: pds_dest,
      handle: handle_dest,
      token: token_service,
      password: pw_dest,
      email,
      did,
      invite_code: inviteCode,
    };

    const createAccountRes = await fetch(`${MIGRATOR_BACKEND}/create-account`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!createAccountRes.ok) {
      throw new CreateAccountError(createAccountRes.statusText);
    }

    // Get new user token
    const agent_dest = new AtpAgent({ service: pds_dest! });

    const { data } = await agent_dest.login({
      identifier: handle_dest,
      password: pw_dest,
    });

    return { token_dest: data.accessJwt };
  }
}

export async function exportRepo(
  { pds_origin, did, token_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (!pds_origin || !did) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  // export repo

  const res = await fetch(`${MIGRATOR_BACKEND}/export-repo`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_origin,
      did,
      token: token_origin,
    }),
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }
}

export async function importRepo(
  { pds_origin, pds_dest, did, token_dest }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (!pds_origin || !did) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }
  {
    // import repo
    const res = await fetch(`${MIGRATOR_BACKEND}/import-repo`, {
      method: "post",
      body: JSON.stringify({
        pds_host: pds_dest,
        did,
        token: token_dest,
      }),
    });

    if (!res.ok) {
      throw new MigrationError((await res.json<{ message: string }>()).message);
    }
  }
}

export async function exportBlobs(
  { pds_origin, pds_dest, did, token_dest, token_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (!pds_origin || !did) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  // missing blobs
  const res = await fetch(`${MIGRATOR_BACKEND}/export-blobs`, {
    method: "post",
    body: JSON.stringify({
      did,
      destination: pds_dest,
      destination_token: token_dest,
      origin: pds_origin,
      origin_token: token_origin,
    }),
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }
}

export async function uploadBlobs(
  { pds_origin, pds_dest, did, token_dest }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  if (!pds_origin || !did) {
    throw new MigrationError(
      "Unable to resolve original account; please login again."
    );
  }

  // upload blobs
  const res = await fetch(`${MIGRATOR_BACKEND}/upload-blobs`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_dest,
      did,
      token: token_dest,
    }),
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }
}

export async function migratePreferences(
  { pds_origin, pds_dest, did, token_dest, token_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  // migrate preferences
  const res = await fetch(`${MIGRATOR_BACKEND}/migrate-preferences`, {
    method: "post",
    body: JSON.stringify({
      did,
      destination: pds_dest,
      destination_token: token_dest,
      origin: pds_origin,
      origin_token: token_origin,
    }),
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }
}

export async function requestPlcToken(
  { pds_origin, did, token_origin }: SessionData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  // req PLC token
  const res = await fetch(`${MIGRATOR_BACKEND}/request-token`, {
    method: "post",
    body: JSON.stringify({
      pds_host: pds_origin,
      did,
      token: token_origin,
    }),
  });

  if (!res.ok) {
    throw new MigrationError((await res.json<{ message: string }>()).message);
  }
}

export async function validatePlcToken(
  { pds_dest, did, token_dest, pds_origin, token_origin }: SessionData,
  data: FormData,
  { MIGRATOR_BACKEND }: CloudflareEnvironment
) {
  const submitted = data.has("submit");
  const plcToken = data.get("plc-token") as string;

  if (submitted) {
    // activate new account
    fetch(`${MIGRATOR_BACKEND}/activate-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: pds_dest,
        did,
        token: token_dest,
      }),
    });

    // deactivate old account
    fetch(`${MIGRATOR_BACKEND}/deactivate-account`, {
      method: "post",
      body: JSON.stringify({
        pds_host: pds_origin,
        did,
        token: token_origin,
      }),
    });

    // deactivate old account
    fetch(`${MIGRATOR_BACKEND}/migrate-plc`, {
      method: "post",
      body: JSON.stringify({
        destination: pds_dest,
        destination_token: token_dest,
        origin: pds_origin,
        did,
        origin_token: token_origin,
        plc_signing_token: plcToken,
        // user_recover_key,
      }),
    });
  }
}
