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
import { getStage } from "./get-stage";
import { STAGES } from "./stages";
import { logger } from "./logger";

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
  const state = {
    do_journey: session.get("do_journey"),
    handle_origin: session.get("handle_origin"),
    handle_dest: session.get("handle_dest"),
    pds_dest: session.get("pds_dest"),
    pds_origin: session.get("pds_origin"),
    token_origin: session.get("token_origin"),
    token_dest: session.get("token_dest"),
    token_service: session.get("token_service"),
    plc_hostname: session.get("plc_hostname"),
    did: session.get("did"),
    password_origin: session.get("password_origin"),
    inviteCode: session.get("inviteCode"),
    email: session.get("email"),
    user_recover_key: session.get("user_recover_key"),

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

  const stage = getStage(state);

  const isCancelling = data.get("cancel");

  console.log("isCancelling: " + isCancelling)

  if (isCancelling) {
    //Reset all session variables
    session.set("do_journey", undefined);
    session.set("handle_origin", undefined);
    session.set("handle_dest", undefined);
    session.set("pds_dest", undefined);
    session.set("pds_origin", undefined);
    session.set("token_origin", undefined);
    session.set("token_dest", undefined);
    session.set("token_service", undefined);
    session.set("plc_hostname", undefined);
    session.set("did", undefined);
    session.set("inviteCode", undefined);
    session.set("email", undefined);
    session.set("user_recover_key", undefined);
    session.set("password_origin", undefined);

    // state flags
    session.set("hasBackup", false);
    session.set("exportedRepo", false);
    session.set("importedRepo", false);
    session.set("exportedBlobs", false);
    session.set("importedBlobs", false);
    session.set("migratedPrefs", false);
    session.set("requestedPlcToken", false);
    session.set("originDeactivated", false);
    session.set("destActivated", false);
    session.set("migratedPlc", false);

  }

  else {
    switch (stage) {
      case STAGES.INVITE_CODE: {
        const invite = data.get("invite-code") as string;
        state.do_journey =
          (data.get("create") as "create" | null) ||
          (data.get("migrate") as "migrate" | null) ||
          "create";
        state.inviteCode = invite;
        session.set("inviteCode", state.inviteCode);
        session.set("do_journey", state.do_journey);

        //initialize the origin PDS to bluesky
                session.set("pds_origin", "https://bsky.social");
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
          password_origin
        } = await loginOrigin(state, data, env);

        session.set("pds_origin", pds_origin);
        session.set("email", email);
        session.set("token_origin", token_origin);
        session.set("token_service", token_service);
        session.set("handle_origin", handle_origin);
        session.set("did", did);
        session.set("password_origin", password_origin);
        break;
      }

      case STAGES.CREATE_DEST_ACCOUNT: {
        if (!state.email) {
          state.email = data.get("email") as string;
          session.set("email", state.email);
        }

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
      case STAGES.GENERATE_RECOVERY_KEY: {
        session.set(
          "user_recover_key",
          data.get("user_recover_key") as string | null
        );
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
        const { ok } = await validatePlcToken(state, data, env);
        if (ok) {
          session.set("destActivated", ok);
          session.set("originDeactivated", ok);
          session.set("migratedPlc", ok);
        }
        break;
      }
    }
  }

  return state;
};
