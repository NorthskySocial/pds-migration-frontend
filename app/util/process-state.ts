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
  resumeMigration,
} from "~/actions";
import { type SessionData, type SessionFlashData } from "~/sessions.server";
import { getStage } from "./get-stage";
import { STAGES } from "./stages";
import { AuthFactorTokenRequiredError } from "@atproto/api/dist/client/types/com/atproto/server/createSession";
import f from "./mock-fetch";

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
  // @TODO replace this with session.data
  const state: SessionData = {
    do_journey: session.get("do_journey"),
    handle_origin: session.get("handle_origin"),
    handle_dest: session.get("handle_dest"),
    pds_dest: session.get("pds_dest"),
    atp_origin_session: session.get("atp_origin_session"),
    pds_origin: session.get("pds_origin"),
    atp_dest_session: session.get("atp_dest_session"),
    token_origin: session.get("token_origin"),
    token_dest: session.get("token_dest"),
    plc_hostname: session.get("plc_hostname"),
    did: session.get("did"),
    password_origin: session.get("password_origin"),
    inviteCode: session.get("inviteCode"),
    email: session.get("email"),
    user_recover_key: session.get("user_recover_key"),
    export_job_id: session.get("export_job_id"),
    export_job_failures: session.get("export_job_failures"),
    export_total: null,
    export_pct_done: null,
    last_export_check: session.get("last_export_check"),
    handle_not_available: session.get("handle_not_available"),
    password_mismatch: session.get("password_mismatch"),
    password_too_short: session.get("password_too_short"),

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
    require_2fa_code: session.get("require_2fa_code") ?? false,
  };

  const stage = getStage(state);

  const isCancelling = data.get("cancel");

  console.log("isCancelling: " + isCancelling);

  if (isCancelling) {
    //Reset all session variables
    session.set("do_journey", undefined);
    session.set("handle_origin", undefined);
    session.set("handle_dest", undefined);
    session.set("pds_dest", undefined);
    session.set("atp_dest_session", undefined);
    session.set("pds_origin", undefined);
    session.set("atp_origin_session", undefined);
    session.set("token_origin", undefined);
    session.set("token_dest", undefined);
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
          break;
        } catch (e) {
          if (e instanceof AuthFactorTokenRequiredError) {
            session.set("require_2fa_code", true);
            session.flash(
              "error",
              "Please check your email for your login code and enter it below"
            );
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
      case STAGES.EXPORT_BLOBS_ORIGIN: {
        if (!state.export_job_id) {
          const { job_id } = (await exportBlobs(state, migratorBackend)) ?? {};
          if (job_id) {
            session.set("export_job_id", job_id);
            state.export_job_id = job_id;
          }
        } else if (state.export_job_id && !state.exportedBlobs) {
          const now = Date.now();
          const lastCheck = state.last_export_check ?? 0;
          const CHECK_INTERVAL_MS = 2500;

          // Only check job status if enough time has passed
          if (now - lastCheck >= CHECK_INTERVAL_MS) {
            console.log(
              "Checking export job status (last attempt, now): ",
              lastCheck,
              now
            );

            // NOTE: this try-catch is added to handle transient errors on the back-end,
            // but a more robust solution should be added in the future (maybe centrally on `f`)
            try {
              const res = await f(
                `${migratorBackend}/jobs/${state.export_job_id}`
              );
              console.log("Response status from job status check: ", res.status);

              // I don't know where to put this def
              const { progress, status } = (await res.json()) as {
                created_at: number;
                finished_at: number;
                id: string;
                kind: "ExportBlobs";
                progress: {
                  invalid_blob_ids: string[];
                  invalid_blobs: number;
                  successful_blobs: number;
                  successful_blobs_ids: string[];
                  total: number;
                };
                started_at: number;
                status: string;
              };

              console.log(
                "Export blobs (progress, status, status code): ",
                progress,
                status,
                res.status
              );

              state.export_progress = {
                invalid_blobs: progress.invalid_blobs,
                successful_blobs: progress.successful_blobs,
                total: progress.total,
              };
              session.set("last_export_check", now);
              session.set("export_job_failures", 0);

              if (status.toLowerCase() === "success") {
                session.set("exportedBlobs", true);
              }
            } catch (error) {
              const statusCode = error instanceof Response ? error.status : null;
              const isSyntaxError = error instanceof SyntaxError;
              console.log("Error checking export blobs job status: ", error);

              if (statusCode === 404 || statusCode === 429 || isSyntaxError) {
                const failureCount = (state.export_job_failures ?? 0) + 1;

                session.set("export_job_failures", failureCount);

                console.log(
                  `Export blobs job check failed with status ${statusCode} and error ${error}. Failure count: ${failureCount}`
                );

                if (failureCount >= 3) {
                  throw new Error(
                    `Export blobs job check failed with status ${statusCode} (error: ${error}) after ${failureCount} consecutive attempts`
                  );
                }

                break;
              }

              throw error;
            }
          }
        }

        break;
      }
      case STAGES.IMPORT_BLOBS_DEST: {
        const { ok } = await uploadBlobs(state, migratorBackend);
        if (ok) {
          session.set("importedBlobs", ok);
        }
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
        } catch (e) {
          if (e instanceof AuthFactorTokenRequiredError) {
            session.set("require_2fa_code", true);
            session.flash(
              "error",
              "Please check your email for your login code and enter it below"
            );
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

        break;
      }
    }
  }

  return state;
};
