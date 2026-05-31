import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/util/logger", () => {
  const log = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  };
  return {
    logger: {
      ...log,
      withDid: () => log,
    },
  };
});

const fetchMock = vi.fn();
vi.mock("~/util/mock-fetch", () => ({
  default: (...args: unknown[]) => fetchMock(...args),
}));

import { processBackgroundJobStage, type BackgroundJobConfig } from "~/util/jobs";
import type { SessionData, SessionFlashData } from "~/sessions.server";
import type { Session } from "react-router";

type AnySession = Session<SessionData, SessionFlashData>;

const buildSession = (initial: Partial<SessionData>): AnySession => {
  const data: Record<string, unknown> = { ...initial };
  const session = {
    data,
    get: (key: string) => data[key],
    set: (key: string, value: unknown) => {
      data[key] = value;
    },
    unset: (key: string) => {
      delete data[key];
    },
    has: (key: string) => key in data,
    flash: vi.fn(),
    id: "test-session",
  };
  return session as unknown as AnySession;
};

const uploadConfig: BackgroundJobConfig = {
  jobIdKey: "import_job_id",
  progressKey: "upload_progress",
  lastCheckKey: "last_import_check",
  failuresKey: "import_job_failures",
  completedKey: "importedBlobs",
  jobKind: "UploadBlobs",
  startJob: vi.fn(),
};

const BACKEND = "https://migrator.example";

const buildState = (overrides: Partial<SessionData> = {}): SessionData => ({
  did: "did:plc:test",
  import_job_id: "job-123",
  last_import_check: 0,
  importedBlobs: false,
  ...overrides,
}) as SessionData;

describe("processBackgroundJobStage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("increments failure counter and returns when receiving 429, without crashing on undefined progress", async () => {
    fetchMock.mockResolvedValue(
      new Response("Too Many Requests", { status: 429 })
    );

    const state = buildState();
    const session = buildSession(state);

    await expect(
      processBackgroundJobStage(state, session, uploadConfig, BACKEND)
    ).resolves.toBeUndefined();

    expect(session.get("import_job_failures")).toBe(1);
    expect(session.get("importedBlobs")).toBeFalsy();
    expect(session.get("upload_progress")).toBeUndefined();
  });

  it("throws after 3 consecutive 429 failures", async () => {
    fetchMock.mockResolvedValue(
      new Response("Too Many Requests", { status: 429 })
    );

    const state = buildState({ import_job_failures: 2 });
    const session = buildSession(state);

    await expect(
      processBackgroundJobStage(state, session, uploadConfig, BACKEND)
    ).rejects.toThrow(/429/);

    expect(session.get("import_job_failures")).toBe(3);
  });

  it("resets failure counter on a successful job status check", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          created_at: 0,
          finished_at: 0,
          id: "job-123",
          kind: "UploadBlobs",
          progress: {
            invalid_blobs: 0,
            successful_blobs: 5,
            total: 10,
          },
          started_at: 0,
          status: "running",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const state = buildState({ import_job_failures: 2 });
    const session = buildSession(state);

    await processBackgroundJobStage(state, session, uploadConfig, BACKEND);

    expect(session.get("import_job_failures")).toBe(0);
    expect(session.get("upload_progress")).toEqual({
      invalid_blobs: 0,
      successful_blobs: 5,
      total: 10,
    });
  });

  it("handles 404 the same way as 429 (counts as failure, returns)", async () => {
    fetchMock.mockResolvedValue(
      new Response("Not Found", { status: 404 })
    );

    const state = buildState();
    const session = buildSession(state);

    await expect(
      processBackgroundJobStage(state, session, uploadConfig, BACKEND)
    ).resolves.toBeUndefined();

    expect(session.get("import_job_failures")).toBe(1);
  });

  it("rethrows non-retryable errors immediately", async () => {
    fetchMock.mockResolvedValue(
      new Response("Server Error", { status: 500 })
    );

    const state = buildState();
    const session = buildSession(state);

    await expect(
      processBackgroundJobStage(state, session, uploadConfig, BACKEND)
    ).rejects.toBeDefined();

    expect(session.get("import_job_failures")).toBeUndefined();
  });

  it("marks job as completed on success status", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          created_at: 0,
          finished_at: 0,
          id: "job-123",
          kind: "UploadBlobs",
          progress: {
            invalid_blobs: 0,
            successful_blobs: 10,
            total: 10,
          },
          started_at: 0,
          status: "success",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const state = buildState();
    const session = buildSession(state);

    await processBackgroundJobStage(state, session, uploadConfig, BACKEND);

    expect(session.get("importedBlobs")).toBe(true);
  });
});
