import { lazy } from "react";
import { STAGES } from "~/util/stages";

export const Intro = lazy(() => import("./intro"));
export const EncourageBackup = lazy(() => import("./encourage-backup"));
export const OriginLogin = lazy(() => import("./origin-login"));
export const NewAccount = lazy(() => import("./new-account"));
export const MigrationProgress = lazy(() => import("./migration-progress"));
export const ValidatePLCToken = lazy(() => import("./validate-plc-token"));
export const DoneMigration = lazy(() => import("./done-migration"));
export const FailedMigration = lazy(() => import("./failed-migration"));
export const AddRotationKey = lazy(() => import("./add-rotation-key.client"));
export const ResumeMigration = lazy(() => import("./migration-resume"));
export const Maintenance = lazy(() => import("./maintenance"));

export const SCREENS = {
  [STAGES.INVITE_CODE]: Intro,
  [STAGES.MAINTENANCE]: Maintenance,
  [STAGES.BACKUP_NOTICE]: EncourageBackup,
  [STAGES.ORIGIN_PDS_LOGIN]: OriginLogin,
  [STAGES.GENERATE_RECOVERY_KEY]: AddRotationKey,
  [STAGES.CREATE_DEST_ACCOUNT]: NewAccount,
  [STAGES.EXPORT_REPO_ORIGIN]: MigrationProgress,
  [STAGES.IMPORT_REPO_DEST]: MigrationProgress,
  [STAGES.EXPORT_BLOBS_ORIGIN]: MigrationProgress,
  [STAGES.IMPORT_BLOBS_DEST]: MigrationProgress,
  [STAGES.MIGRATE_PREFERENCES]: MigrationProgress,
  [STAGES.REQUEST_PLC]: MigrationProgress,
  [STAGES.ACTIVATE_DEST]: ValidatePLCToken,
  [STAGES.DEACTIVATE_ORIGIN]: ValidatePLCToken,
  [STAGES.MIGRATE_PLC]: ValidatePLCToken,
  [STAGES.DONE]: DoneMigration,
  [STAGES.FAILED]: FailedMigration,
  [STAGES.RESUME_MIGRATION]: ResumeMigration,

};
