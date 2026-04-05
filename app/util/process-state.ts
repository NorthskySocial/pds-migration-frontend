"use server";

import { type Session } from "react-router";
import {
  checkIfDidExistsInDest,
  createDestAccount,
  exportBlobs,
  exportRepo,
  importRepo,
  loginOrigin,
  migratePreferences,
  requestPlcToken,
  uploadBlobs,
  validatePlcToken,
  resumeMigration,
} from "~/actions";
import { type SessionData, type SessionFlashData } from "~/sessions.server";
import { getStage } from "./get-stage";
import { STAGES } from "./stages";
import { AuthFactorTokenRequiredError } from "@atproto/api/dist/client/types/com/atproto/server/createSession";
import { sendDiscordMessage } from "./discord";
import { processBlobJobStage } from "./jobs";

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
  migratorBackend: string
) => {
  const state = session.data as SessionData;
  const stage = getStage(state);

  const isCancelling = data.get("cancel");
  const isResendingPlcToken = data.get("resend_plc_token");
  const isResetResume = data.get("reset-resume");

  console.log(`On processState with stage: ${stage} | isCancelling: ${isCancelling} | isResetResume: ${isResetResume} | isResendingPlcToken: ${isResendingPlcToken}`);

  if (isResendingPlcToken) {
    session.set("requestedPlcToken", false);
    return state;
  }

  const inviteCode = state.inviteCode;
  if (isCancelling || isResetResume) {
    //Reset all session variables
    session.set("do_journey", undefined);
    session.set("handle_origin", undefined);
    session.set("handle_dest", undefined);
    session.set("pds_dest", undefined);
    session.set("atp_dest_session", undefined);
    session.set("pds_origin", undefined);
    session.set("atp_origin_session", undefined);
    session.set("did_exists_in_dest", undefined);
    session.set("token_origin", undefined);
    session.set("token_dest", undefined);
    session.set("plc_hostname", undefined);
    session.set("did", undefined);
    session.set("inviteCode", undefined);
    session.set("email", undefined);
    session.set("user_recover_key", undefined);
    session.set("password_origin", undefined);

    // state flags
    session.set("require_2fa_code", false);
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

    if (isResetResume) {
      // Shotcut to the resume screen
      session.set("inviteCode", inviteCode as string);
      session.set("do_journey", "resume");
    }

    return state;
  } else {
    console.log("Processing stage: " + stage);

    switch (stage) {
      case STAGES.INVITE_CODE: {
        const invite = data.get("invite-code") as string;
        state.do_journey =
          (data.get("create") as "create" | null) ||
          (data.get("migrate") as "migrate" | null) ||
          (data.get("resume") as "resume" | null) ||
          (data.get("missing-blobs") as "missing-blobs" | null) ||
          "resume";
        console.log("Do_journey " + state.do_journey);
        state.inviteCode = invite;

        session.set("inviteCode", state.inviteCode);
        session.set("do_journey", state.do_journey);
        session.set("handle_dest", undefined);
        session.set("email", undefined);

        //initialize the origin PDS to bluesky
        session.set("pds_origin", "https://bsky.social");

        if (state.do_journey === "resume") {
          //Reset tokens
          session.set("token_origin", undefined);
          session.set("token_dest", undefined);
          session.set("password_origin", undefined);
        }

        break;
      }

      case STAGES.BACKUP_NOTICE: {
        state.hasBackup = data.get("confirm") === "on";
        session.set("hasBackup", state.hasBackup);
        break;
      }

      case STAGES.ORIGIN_PDS_LOGIN: {
        // If at this point we know the user requires a 2FA code, that means
        // this stage as already submitted once so we already have PDS/handle/password.
        // In that case, we don't read from form or save to session and just retrieve.
        // Otherwise (first attempt or no 2FA), read from form and save to session.
        const is2faAttempt = session.get("require_2fa_code") ?? false;
        console.log("User attempting 2FA login? " + is2faAttempt);

        let pds_origin = (data.get("pds") as string) ?? "https://bsky.social";
        let handle_origin = data.get("bsky-handle") as string;
        let password_origin = (data.get("bsky-password") as string) ?? "";

        if (is2faAttempt) {
          pds_origin = session.get("pds_origin") ?? pds_origin;
          handle_origin = session.get("handle_origin") ?? handle_origin;
          password_origin = session.get("password_origin") ?? password_origin;

          console.log("User session retrieved from first sign-in attempt, handle: ", handle_origin);
        } else {
          console.log("User session before update, handle: ", session.get("handle_origin") ?? "not set");

          session.set("pds_origin", pds_origin);
          session.set("handle_origin", handle_origin);
          session.set("password_origin", password_origin);

          console.log("User session saved from form, handle: ", handle_origin);
        }

        try {
          const { token_origin, email, did, atp_origin_session } =
            await loginOrigin({
              pds_origin,
              handle_origin,
              password_origin,
              authFactorToken: (data.get("2fa_code") as string) ?? undefined,
            });

          session.set("email", email);
          session.set("token_origin", token_origin);
          session.set("did", did);
          session.set("atp_origin_session", atp_origin_session);

          // At this point, we no longer need the origin password
          session.set("password_origin", undefined);

          const did_exists_in_dest = await checkIfDidExistsInDest(
            did,
            session.get("pds_dest") ?? "https://northsky.social",
          );
          session.set("did_exists_in_dest", did_exists_in_dest);

          console.log(`Origin login successful! DID ${did}, exists in destination PDS: ${did_exists_in_dest}`);
          break;
        } catch (e) {
          console.log("Error during origin login: ", e);

          if (e instanceof AuthFactorTokenRequiredError) {
            session.set("require_2fa_code", true);
            session.flash(
              "error",
              "Please check your email for your login code and enter it below"
            );
            session.flash("errorType", "Expected");
            break;
          }

          throw e;
        }
      }

      case STAGES.CREATE_DEST_ACCOUNT: {
        if (!state.email) {
          state.email = data.get("email") as string;
          session.set("email", state.email);
        }

        const is_creation_flow = state.do_journey === "create";

        const {
          handle_not_available,
          token_dest,
          handle_dest,
          passwordTooShort,
          passwordMismatch,
          atp_dest_session,
        } = await createDestAccount(
          state,
          data,
          migratorBackend,
          is_creation_flow
        );

        session.set("handle_not_available", handle_not_available);
        session.set("handle_dest", handle_dest);
        session.set("token_dest", token_dest);
        session.set("password_too_short", passwordTooShort);
        session.set("password_mismatch", passwordMismatch);
        session.set("atp_dest_session", atp_dest_session);

        break;
      }

      case STAGES.EXPORT_REPO_ORIGIN: {
        const { ok } = await exportRepo(state, migratorBackend);
        if (ok) {
          session.set("exportedRepo", ok);
        }
        break;
      }

      case STAGES.IMPORT_REPO_DEST: {
        const { ok } = await importRepo(state, migratorBackend);
        if (ok) {
          session.set("importedRepo", ok);
        }
        break;
      }
      case STAGES.MISSING_BLOBS_EXPORT:
      case STAGES.EXPORT_BLOBS_ORIGIN: {
        await processBlobJobStage(state, session, {
          jobIdKey: "export_job_id",
          progressKey: "export_progress",
          lastCheckKey: "last_export_check",
          failuresKey: "export_job_failures",
          completedKey: "exportedBlobs",
          jobKind: "ExportBlobs",
          startJob: exportBlobs,
        }, migratorBackend);
        break;
      }
      case STAGES.MISSING_BLOBS_IMPORT:
      case STAGES.IMPORT_BLOBS_DEST: {
        await processBlobJobStage(state, session, {
          jobIdKey: "import_job_id",
          progressKey: "upload_progress",
          lastCheckKey: "last_import_check",
          failuresKey: "import_job_failures",
          completedKey: "importedBlobs",
          jobKind: "UploadBlobs",
          startJob: uploadBlobs,
        }, migratorBackend);
        break;
      }
      case STAGES.MIGRATE_PREFERENCES: {
        const { ok } = await migratePreferences(state, migratorBackend);
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
        const { ok } = await requestPlcToken(state, migratorBackend);
        if (ok) {
          session.set("requestedPlcToken", ok);
        }
        break;
      }

      case STAGES.ACTIVATE_DEST:
      case STAGES.DEACTIVATE_ORIGIN:
      case STAGES.MIGRATE_PLC: {
        const { ok } = await validatePlcToken(state, data, migratorBackend);
        if (ok) {
          session.set("destActivated", ok);
          session.set("originDeactivated", ok);
          session.set("migratedPlc", ok);
        }
        break;
      }

      case STAGES.RESUME_MIGRATION: {
        try {
          //Get origin, handle and password from form, immediately save to session
          const pds_origin =
            (data.get("pds") as string) ?? "https://bsky.social";
          session.set("pds_origin", pds_origin);

          const handle_origin = data.get("bsky-handle") as string;
          session.set("handle_origin", handle_origin);

          const password_origin = (data.get("bsky-password") as string) ?? "";
          session.set("password_origin", password_origin);

          const { token_origin, email, did, atp_origin_session } =
            await loginOrigin({
              pds_origin,
              handle_origin,
              password_origin,
              authFactorToken: (data.get("2fa_code") as string) ?? undefined,
            });

          session.set("email", email);
          session.set("token_origin", token_origin);
          session.set("did", did);
          session.set("atp_origin_session", atp_origin_session);

          // At this point, we no longer need the origin password
          session.set("password_origin", undefined);
        } catch (e) {
          if (e instanceof AuthFactorTokenRequiredError) {
            session.set("require_2fa_code", true);
            session.flash(
              "error",
              "Please check your email for your login code and enter it below"
            );
            session.flash("errorType", "Expected");
            break;
          }
          throw e;
        }

        //Get dest handle and password from form
        const handle_dest = data.get("northsky-handle") as string;
        const password_dest = (data.get("northsky-password") as string) ?? "";

        // Save dest handle to form in case it's changed somehow
        session.set("handle_dest", handle_dest);

        const { token_dest, atp_dest_session } = await resumeMigration({
          pds_dest: state.pds_dest ?? "https://northsky.social",
          handle_dest,
          password_dest,
        });

        session.set("token_dest", token_dest);
        session.set("atp_dest_session", atp_dest_session);

        const did = session.get("did") ?? "unknown DID";
        await sendDiscordMessage(`Migration resumed for account [**${handle_dest}**](<https://bsky.app/profile/${did}>) (${did}) (migration in progress)`);

        break;
      }
    }
  }

  return state;
};
