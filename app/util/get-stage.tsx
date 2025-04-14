"use server";

import { type Session } from "react-router";
import {
  createDestAccount,
  exportBlobs,
  exportRepo,
  importRepo,
  loginOrigin,
  migratePreferences,
  requestPlcToken,
  uploadBlobs,
  validatePlcToken,
} from "~/actions";
import { type SessionData, type SessionFlashData } from "~/sessions.server";
import { STAGES } from "./stages";

/**
 * Returns true is all arguments are truthy.
 * @param items
 * @returns
 */
const all = (...items: any[]) => items.every((i) => i);

/**
 * Returns the correct stage based on session value availability.
 * @param session
 * @returns STAGES
 */
export function getStage(session: SessionData) {
  if (!session.inviteCode) {
    return STAGES.INVITE_CODE;
  }

  if (!session.hasBackup) {
    return STAGES.BACKUP_NOTICE;
  }

  if (
    !all(
      session.token_origin,
      session.did,
      session.pds_origin,
      session.token_service
    )
  ) {
    return STAGES.ORIGIN_PDS_LOGIN;
  }

  if (!all(session.token_dest, session.handle_dest, session.pds_dest)) {
    return STAGES.CREATE_DEST_ACCOUNT;
  }

  if (!session.exportedRepo) {
    return STAGES.EXPORT_REPO_ORIGIN;
  }

  if (!session.importedRepo) {
    return STAGES.IMPORT_REPO_DEST;
  }

  if (!session.exportedBlobs) {
    return STAGES.EXPORT_BLOBS_ORIGIN;
  }

  if (!session.importedBlobs) {
    return STAGES.IMPORT_BLOBS_DEST;
  }

  if (!session.migratedPrefs) {
    return STAGES.MIGRATE_PREFERENCES;
  }

  if (!session.requestedPlcToken) {
    return STAGES.REQUEST_PLC;
  }

  if (!session.destActivated) {
    return STAGES.ACTIVATE_DEST;
  }

  if (!session.originDeactivated) {
    return STAGES.DEACTIVATE_ORIGIN;
  }

  if (!session.migratedPlc) {
    return STAGES.MIGRATE_PLC;
  }

  if (all(...Object.values(session))) {
    return STAGES.DONE;
  }

  return STAGES.FAILED;
}

/**
 * Takes the form data, runs any side-effect actions,
 * sets new session data, return redirect.
 * @param session
 * @param data
 * @returns
 */
export const processState = async (
  session: Session<SessionData, SessionFlashData>,
  data: FormData,
  env: CloudflareEnvironment
) => {
  console.log("processState");
  const state = {
    handle_origin: session.get("handle_origin"),
    handle_dest: session.get("handle_dest"),
    pds_dest: session.get("pds_dest"),
    pds_origin: session.get("pds_origin"),
    token_origin: session.get("token_origin"),
    token_dest: session.get("token_dest"),
    token_service: session.get("token_service"),
    plc_hostname: session.get("plc_hostname"),
    did: session.get("did"),
    inviteCode: session.get("inviteCode"),
    email: session.get("email"),

    // state flags
    hasBackup: session.get("hasBackup") ?? false,
    exportedRepo: session.get("exportedRepo") ?? false,
    importedRepo: session.get("importedRepo") ?? false,
    exportedBlobs: session.get("exportedBlobs") ?? false,
    importedBlobs: session.get("importedBlobs") ?? false,
    migratedPrefs: session.get("migratedPrefs") ?? false,
    requestedPlcToken: session.get("requestedPlcToken") ?? false,
    originDeactivated: session.get("originDeactivated") ?? false,
    destActivated: session.get("destActivated") ?? false,
    migratedPlc: session.get("migratedPlc") ?? false,
  };
  console.log(state);

  const stage = getStage(state);

  switch (stage) {
    case STAGES.INVITE_CODE: {
      const invite = data.get("invite-code") as string;
      state.inviteCode = invite;
      session.set("inviteCode", state.inviteCode);
      break;
    }

    case STAGES.BACKUP_NOTICE: {
      state.hasBackup = data.get("confirm") === "on";
      session.set("hasBackup", state.hasBackup);
      break;
    }

    case STAGES.ORIGIN_PDS_LOGIN: {
      const {
        pds_origin,
        email,
        token_origin,
        token_service,
        handle_origin,
        did,
      } = await loginOrigin(state, data, env);

      session.set("pds_origin", pds_origin);
      session.set("email", email);
      session.set("token_origin", token_origin);
      session.set("token_service", token_service);
      session.set("handle_origin", handle_origin);
      session.set("did", did);
      break;
    }

    case STAGES.CREATE_DEST_ACCOUNT: {
      const { handle_available, token_dest, handle_dest } =
        await createDestAccount(state, data, env);

      if (token_dest) {
        session.set("token_dest", token_dest);
      } else if (handle_available) {
        session.set("handle_dest", handle_dest);
      }

      break;
    }

    case STAGES.EXPORT_REPO_ORIGIN: {
      const { ok } = await exportRepo(state, env);
      if (ok) {
        session.set("exportedRepo", ok);
      }
      break;
    }
    case STAGES.IMPORT_REPO_DEST: {
      const { ok } = await importRepo(state, env);
      if (ok) {
        session.set("importedRepo", ok);
      }
      break;
    }
    case STAGES.EXPORT_BLOBS_ORIGIN: {
      const { ok } = await exportBlobs(state, env);
      if (ok) {
        session.set("exportedBlobs", ok);
      }
      break;
    }
    case STAGES.IMPORT_BLOBS_DEST: {
      const { ok } = await uploadBlobs(state, env);
      if (ok) {
        session.set("importedBlobs", ok);
      }
      break;
    }
    case STAGES.MIGRATE_PREFERENCES: {
      const { ok } = await migratePreferences(state, env);
      if (ok) {
        session.set("migratedPrefs", ok);
      }
      break;
    }
    case STAGES.REQUEST_PLC: {
      const { ok } = await requestPlcToken(state, env);
      if (ok) {
        session.set("requestedPlcToken", ok);
      }
      break;
    }

    case STAGES.ACTIVATE_DEST:
    case STAGES.DEACTIVATE_ORIGIN:
    case STAGES.MIGRATE_PLC: {
      console.log("LAST STAGE");
      const { ok } = await validatePlcToken(state, data, env);
      if (ok) {
        session.set("destActivated", ok);
        session.set("originDeactivated", ok);
        session.set("migratedPlc", ok);
      }
      break;
    }
  }

  return state;
};
