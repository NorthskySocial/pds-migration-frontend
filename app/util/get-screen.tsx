"use client";

import { STAGES } from "./types";

/**
 * Gets the correct screen component based on stage.
 */
export const getScreen = (stage: STAGES) => {
  switch (stage) {
    default:
    case STAGES.INVITE_CODE:
      return import("../screens/intro");

    case STAGES.BACKUP_NOTICE:
      return import("../screens/encourage-backup");

    case STAGES.ORIGIN_PDS_LOGIN:
      return import("../screens/origin-login");

    case STAGES.CREATE_DEST_ACCOUNT:
      return import("../screens/new-account");

    case STAGES.EXPORT_REPO_ORIGIN:
    case STAGES.IMPORT_REPO_DEST:
    case STAGES.EXPORT_BLOBS_ORIGIN:
    case STAGES.IMPORT_BLOBS_DEST:
    case STAGES.MIGRATE_PREFERENCES:
      return import("../screens/migration-progress");

    case STAGES.REQUEST_PLC:
    case STAGES.ACTIVATE_DEST:
    case STAGES.DEACTIVATE_ORIGIN:
    case STAGES.MIGRATE_PLC:
      return import("../screens/validate-plc-token");

    case STAGES.DONE:
      return import("../screens/done-migration");

    case STAGES.FAILED:
      return import("../screens/failed-migration");
  }
};
