"use client";

import { STAGES } from "./types";
import { lazy } from "react";
/**
 * Gets the correct screen component based on stage.
 */
export const getScreen = (stage: STAGES) => {
  console.log("getscreen", stage);
  switch (stage) {
    default:
    case STAGES.INVITE_CODE:
      return lazy(() => import("../screens/intro"));

    case STAGES.BACKUP_NOTICE:
      return lazy(() => import("../screens/encourage-backup"));

    case STAGES.ORIGIN_PDS_LOGIN:
      return lazy(() => import("../screens/origin-login"));

    case STAGES.CREATE_DEST_ACCOUNT:
      return lazy(() => import("../screens/new-account"));

    case STAGES.EXPORT_REPO_ORIGIN:
    case STAGES.IMPORT_REPO_DEST:
    case STAGES.EXPORT_BLOBS_ORIGIN:
    case STAGES.IMPORT_BLOBS_DEST:
    case STAGES.MIGRATE_PREFERENCES:
      return lazy(() => import("../screens/migration-progress"));

    case STAGES.REQUEST_PLC:
    case STAGES.ACTIVATE_DEST:
    case STAGES.DEACTIVATE_ORIGIN:
    case STAGES.MIGRATE_PLC:
      return lazy(() => import("../screens/validate-plc-token"));

    case STAGES.DONE:
      return lazy(() => import("../screens/done-migration"));

    case STAGES.FAILED:
      return lazy(() => import("../screens/failed-migration"));
  }
};
