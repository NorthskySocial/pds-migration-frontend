"use server";

import { type Session } from "react-router";
import { type SessionData, type SessionFlashData, type BackgroundJobProgress } from "~/sessions.server";
import f from "./mock-fetch";

const JOB_CHECK_INTERVAL_MS = 2000;

/**
 * Configuration for a background job (export or import)
 */
export type BackgroundJobConfig = {
  jobIdKey: "export_job_id" | "import_job_id";
  progressKey: "export_progress" | "upload_progress";
  lastCheckKey: "last_export_check" | "last_import_check";
  failuresKey: "export_job_failures" | "import_job_failures";
  completedKey: "exportedBlobs" | "importedBlobs";
  jobKind: "ExportBlobs" | "UploadBlobs";
  startJob: (state: SessionData, backend: string) => Promise<{ job_id?: string } | undefined>;
};

/**
 * Response type for job status check
 */
type JobStatusResponse = {
  created_at: number;
  finished_at: number;
  id: string;
  kind: string;
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

/**
 * Starts a blob job if not already started
 */
const startBackgroundJobIfNeeded = async (
  state: SessionData,
  session: Session<SessionData, SessionFlashData>,
  config: BackgroundJobConfig,
  migratorBackend: string
): Promise<boolean> => {
  const existingJobId = state[config.jobIdKey];
  if (existingJobId) return false;

  const result = await config.startJob(state, migratorBackend);
  if (result?.job_id) {
    session.set(config.jobIdKey, result.job_id);
    state[config.jobIdKey] = result.job_id;
  }
  return true;
};

/**
 * Checks the status of a blob job and updates session accordingly
 */
const checkBackgroundJobStatus = async (
  state: SessionData,
  session: Session<SessionData, SessionFlashData>,
  config: BackgroundJobConfig,
  migratorBackend: string
): Promise<void> => {
  const jobId = state[config.jobIdKey];
  const isCompleted = state[config.completedKey];

  if (!jobId || isCompleted) return;

  const now = Date.now();
  const lastCheck = state[config.lastCheckKey] ?? 0;

  // Only check job status if enough time has passed
  if (now - lastCheck < JOB_CHECK_INTERVAL_MS) return;

  console.log(
    `Checking ${config.jobKind} job status (last attempt, now): `,
    lastCheck,
    now
  );

  try {
    const res = await f(`${migratorBackend}/jobs/${jobId}`);
    console.log("Response status from job status check: ", res.status);

    const { progress, status } = (await res.json()) as JobStatusResponse;

    console.log(
      `${config.jobKind} (progress, status, status code): `,
      `${progress.successful_blobs}/${progress.total} (invalid: ${progress.invalid_blobs})`,
      status,
      res.status
    );

    const progressData: BackgroundJobProgress = {
      invalid_blobs: progress.invalid_blobs,
      successful_blobs: progress.successful_blobs,
      total: progress.total,
    };

    state[config.progressKey] = progressData;
    session.set(config.progressKey, progressData);
    session.set(config.lastCheckKey, now);
    session.set(config.failuresKey, 0);

    if (status.toLowerCase() === "success") {
      session.set(config.completedKey, true);

      if (config.jobKind === "UploadBlobs" && progress.invalid_blobs > 0) {
        session.set("had_invalid_blobs", true);
      }
    }
  } catch (error) {
    const statusCode = error instanceof Response ? error.status : null;
    const isSyntaxError = error instanceof SyntaxError;
    console.log(`Error checking ${config.jobKind} job status: `, error);

    if (statusCode === 404 || statusCode === 429 || isSyntaxError) {
      const failureCount = (state[config.failuresKey] ?? 0) + 1;
      session.set(config.failuresKey, failureCount);

      console.log(
        `${config.jobKind} job check failed with status ${statusCode} and error ${error}. Failure count: ${failureCount}`
      );

      if (failureCount >= 3) {
        throw new Error(
          `${config.jobKind} job check failed with status ${statusCode} (error: ${error}) after ${failureCount} consecutive attempts`
        );
      }

      return;
    }

    throw error;
  }
};

/**
 * Processes a blob job stage (export or import)
 */
export const processBackgroundJobStage = async (
  state: SessionData,
  session: Session<SessionData, SessionFlashData>,
  config: BackgroundJobConfig,
  migratorBackend: string
): Promise<void> => {
  const jobStarted = await startBackgroundJobIfNeeded(state, session, config, migratorBackend);
  if (!jobStarted) {
    await checkBackgroundJobStatus(state, session, config, migratorBackend);
  }
};
