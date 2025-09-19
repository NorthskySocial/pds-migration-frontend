"use server";

import { type SessionData } from "~/sessions.server";
import { STAGES } from "./stages";

/**
 * Returns true is all arguments are truthy.
 * @param items
 * @returns
 */
const all = (...items: (string | boolean | undefined)[]) =>
  items.every((i) => i);

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

  if (session.user_recover_key === undefined) {
    return STAGES.GENERATE_RECOVERY_KEY;
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
