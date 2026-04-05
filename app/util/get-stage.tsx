"use server";

import { type SessionData } from "~/sessions.server";
import { STAGES } from "./stages";

/**
 * Returns true is all arguments are truthy.
 * @param items
 * @returns
 */
const all = (...items: (string | boolean | undefined | null)[]) =>
  items.every((i) => i);

/**
 * Returns the correct stage based on session value availability.
 * @param session
 * @returns STAGES
 */
export function getStage(session: SessionData): STAGES {
  if (!(session.inviteCode || session.do_journey?.includes("resume"))) {
    return STAGES.INVITE_CODE;
  }

  //Resume path

  console.log("Do journey is " + session.do_journey);

  if (session.do_journey === "resume") {
    if (!session.token_dest || !session.token_origin) {
      return STAGES.RESUME_MIGRATION;
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

    if (session.user_recover_key === undefined) {
      return STAGES.GENERATE_RECOVERY_KEY;
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
  }

  //creation path
  if (session.do_journey === "create") {
    if (!all(session.token_dest, session.handle_dest)) {
      return STAGES.CREATE_DEST_ACCOUNT;
    }

    if (session.user_recover_key === undefined) {
      return STAGES.GENERATE_RECOVERY_KEY;
    }

    return STAGES.DONE;
  }

  //migration path
  if (session.do_journey === "migrate") {
    if (!session.hasBackup) {
      return STAGES.BACKUP_NOTICE;
    }

    if (!all(session.token_origin, session.did, session.pds_origin)) {
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

    if (session.user_recover_key === undefined) {
      return STAGES.GENERATE_RECOVERY_KEY;
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
    return STAGES.DONE;
  }

  // missing-blobs path
  if (session.do_journey === "missing-blobs") {
    if (!all(session.token_dest, session.handle_dest, session.pds_dest)) {
      return STAGES.MISSING_BLOBS_LOGIN;
    }

    if (!session.exportedBlobs) {
      return STAGES.MISSING_BLOBS_EXPORT;
    }

    if (!session.importedBlobs) {
      return STAGES.MISSING_BLOBS_IMPORT;
    }

    return STAGES.MISSING_BLOBS_DONE;
  }

  //safety return
  return STAGES.DONE;
}
