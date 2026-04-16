import type { SessionData } from "~/sessions.server";

/**
 * enum of all migrator stages
 */
export enum STAGES {
  INVITE_CODE = "INVITE_CODE",
  BACKUP_NOTICE = "BACKUP_NOTICE",
  ORIGIN_PDS_LOGIN = "ORIGIN_PDS_LOGIN",
  CREATE_DEST_ACCOUNT = "CREATE_DEST_ACCOUNT",
  EXPORT_REPO_ORIGIN = "EXPORT_REPO_ORIGIN",
  IMPORT_REPO_DEST = "IMPORT_REPO_DEST",
  EXPORT_BLOBS_ORIGIN = "EXPORT_BLOBS_ORIGIN",
  IMPORT_BLOBS_DEST = "IMPORT_BLOBS_DEST",
  MIGRATE_PREFERENCES = "MIGRATE_PREFERENCES",
  RESUME_MIGRATION = "RESUME_MIGRATION",
  GENERATE_RECOVERY_KEY = "GENERATE_RECOVERY_KEY",
  REQUEST_PLC = "REQUEST_PLC",
  ACTIVATE_DEST = "ACTIVATE_DEST",
  DEACTIVATE_ORIGIN = "DEACTIVATE_ORIGIN",
  MIGRATE_PLC = "MIGRATE_PLC",
  DONE = "DONE",
  FAILED = "FAILED",
  MAINTENANCE = "MAINTENANCE",
  MISSING_BLOBS_LOGIN = "MISSING_BLOBS_LOGIN",
  MISSING_BLOBS_EXPORT = "MISSING_BLOBS_EXPORT",
  MISSING_BLOBS_IMPORT = "MISSING_BLOBS_IMPORT",
  MISSING_BLOBS_DONE = "MISSING_BLOBS_DONE",
}

export type ScreenProps = {
  state: SessionData;
  stage?: STAGES;
  error?: string;
  supportFormUrl?: string;
  isUpstreamOutage?: boolean;
};

export const stageInfo = {
  [STAGES.INVITE_CODE]: { stageIdx: -1, stageTitle: "", stageDescription: "" },
  [STAGES.MAINTENANCE]: {
    stageIdx: -1,
    stageTitle: "Maintenance",
    stageDescription: "The migration tool is temporarily unavailable",
  },
  [STAGES.BACKUP_NOTICE]: {
    stageIdx: -1,
    stageTitle: "",
    stageDescription: "",
  },
  [STAGES.ORIGIN_PDS_LOGIN]: {
    stageIdx: -1,
    stageTitle: "",
    stageDescription: "",
  },
  [STAGES.ACTIVATE_DEST]: {
    stageIdx: -1,
    stageTitle: "",
    stageDescription: "",
  },
  [STAGES.DEACTIVATE_ORIGIN]: {
    stageIdx: -1,
    stageTitle: "",
    stageDescription: "",
  },
  [STAGES.MIGRATE_PLC]: { stageIdx: -1, stageTitle: "", stageDescription: "" },
  [STAGES.DONE]: { stageIdx: -1, stageTitle: "", stageDescription: "" },
  [STAGES.FAILED]: { stageIdx: -1, stageTitle: "", stageDescription: "" },
  [STAGES.CREATE_DEST_ACCOUNT]: {
    stageIdx: 0,
    stageTitle: "Creating destination account...",
    stageDescription: "Initialising a new account on the destination PDS",
  },
  [STAGES.EXPORT_REPO_ORIGIN]: {
    stageIdx: 1,
    stageTitle: "Exporting repo...",
    stageDescription: "Exporting repo from old PDS",
  },
  [STAGES.IMPORT_REPO_DEST]: {
    stageIdx: 2,
    stageTitle: "Importing repo...",
    stageDescription: "Import repo to new PDS",
  },
  [STAGES.EXPORT_BLOBS_ORIGIN]: {
    stageIdx: 3,
    stageTitle: "Exporting blobs...",
    stageDescription: "Exporting blobs from old PDS",
  },
  [STAGES.IMPORT_BLOBS_DEST]: {
    stageIdx: 4,
    stageTitle: "Importing blobs...",
    stageDescription: "Importing blobs to new PDS",
  },
  [STAGES.MIGRATE_PREFERENCES]: {
    stageIdx: 5,
    stageTitle: "Migrating preferences...",
    stageDescription: "Copying all your preferences to new PDS",
  },
  [STAGES.GENERATE_RECOVERY_KEY]: {
    stageIdx: 6,
    stageTitle: "Generate recovery key?",
    stageDescription:
      "Generate a recovery key to save in case you ever want to migrate away from Northsky",
  },
  [STAGES.REQUEST_PLC]: {
    stageIdx: 7,
    stageTitle: "Requesting PLC token...",
    stageDescription: "Almost done! Check your email!",
  },
  [STAGES.RESUME_MIGRATION]: {
    stageIdx: 8,
    stageTitle: "Resuming migration",
    stageDescription: "Let's resume your migration.",
  },
  [STAGES.MISSING_BLOBS_LOGIN]: {
    stageIdx: -1,
    stageTitle: "",
    stageDescription: "",
  },
  [STAGES.MISSING_BLOBS_EXPORT]: {
    stageIdx: 0,
    stageTitle: "Exporting missing blobs...",
    stageDescription: "Finding and exporting blobs that need to be imported",
  },
  [STAGES.MISSING_BLOBS_IMPORT]: {
    stageIdx: 1,
    stageTitle: "Importing blobs...",
    stageDescription: "Importing blobs to Northsky",
  },
  [STAGES.MISSING_BLOBS_DONE]: {
    stageIdx: -1,
    stageTitle: "",
    stageDescription: "",
  },
};
