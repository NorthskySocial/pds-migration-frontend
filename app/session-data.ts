import type { AtpSessionData } from "@atproto/api";

export type BackgroundJobProgress = {
  invalid_blobs: number;
  successful_blobs: number;
  total: number;
};

export type SessionData = {
  do_journey?: "create" | "migrate" | "resume" | "fail" | "missing-blobs";
  handle_origin?: string;
  handle_dest?: string;
  password_origin?: string;
  password_dest?: string;
  pds_dest?: string;
  did_exists_in_dest?: boolean;
  did_active_in_dest?: boolean;
  atp_origin_session?: AtpSessionData;
  atp_dest_session?: AtpSessionData;
  pds_origin?: string;
  token_origin?: string;
  token_dest?: string;
  token_ref_origin?: string;
  token_ref_dest?: string;
  plc_hostname?: string;
  did?: string;
  inviteCode?: string;
  email?: string;
  user_recover_key?: string | null;
  export_progress?: BackgroundJobProgress | null;
  export_repo_progress?: BackgroundJobProgress | null;
  upload_progress?: BackgroundJobProgress | null;
  export_job_id?: string | null;
  export_repo_job_id?: string | null;
  import_job_id?: string | null;
  export_job_failures?: number;
  export_repo_job_failures?: number;
  import_job_failures?: number;
  last_export_check?: number;
  last_export_repo_check?: number;
  last_import_check?: number;
  handle_not_available?: boolean | null;
  password_mismatch?: boolean | null;
  password_too_short?: boolean | null;

  // state flags, set a default on the object above when
  // adding new ones
  hasBackup: boolean;
  exportedRepo: boolean;
  importedRepo: boolean;
  exportedBlobs: boolean;
  importedBlobs: boolean;
  migratedPrefs: boolean;
  requestedPlcToken: boolean;
  originDeactivated: boolean;
  destActivated: boolean;
  migratedPlc: boolean;
  require_2fa_code: boolean;
  had_invalid_blobs: boolean;
};

export const INITIAL_SESSION_DATA = {
  do_journey: undefined,
  handle_origin: undefined,
  handle_dest: undefined,
  password_origin: undefined,
  password_dest: undefined,
  pds_dest: undefined,
  did_exists_in_dest: undefined,
  did_active_in_dest: undefined,
  atp_origin_session: undefined,
  atp_dest_session: undefined,
  pds_origin: undefined,
  token_origin: undefined,
  token_dest: undefined,
  token_ref_origin: undefined,
  token_ref_dest: undefined,
  plc_hostname: undefined,
  did: undefined,
  inviteCode: undefined,
  email: undefined,
  user_recover_key: undefined,
  export_progress: undefined,
  export_repo_progress: undefined,
  upload_progress: undefined,
  export_job_id: undefined,
  export_repo_job_id: undefined,
  import_job_id: undefined,
  export_job_failures: undefined,
  export_repo_job_failures: undefined,
  import_job_failures: undefined,
  last_export_check: undefined,
  last_export_repo_check: undefined,
  last_import_check: undefined,
  handle_not_available: undefined,
  password_mismatch: undefined,
  password_too_short: undefined,
  hasBackup: false,
  exportedRepo: false,
  importedRepo: false,
  exportedBlobs: false,
  importedBlobs: false,
  migratedPrefs: false,
  requestedPlcToken: false,
  originDeactivated: false,
  destActivated: false,
  migratedPlc: false,
  require_2fa_code: false,
  had_invalid_blobs: false,
} satisfies { [Key in keyof SessionData]: SessionData[Key] | undefined };

export type ErrorType = "Expected" | "Unexpected";

export type SessionFlashData = {
  title?: string;
  error?: string;
  errorType?: ErrorType;
};
