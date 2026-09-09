import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/util/logger", () => {
  const log = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return {
    logger: {
      ...log,
      withDid: () => log,
    },
  };
});

vi.mock("~/util/discord", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/util/discord")>()),
  sendDiscordMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/util/jobs", () => ({
  processBackgroundJobStage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/util/redis", () => ({
  redisSetNxEx: vi.fn(),
  redisDelIfValueMatches: vi.fn(),
}));

vi.mock("~/actions", () => ({
  checkIfDidExistsInDest: vi.fn(),
  createDestAccount: vi.fn(),
  exportBlobs: vi.fn(),
  exportRepo: vi.fn(),
  importRepo: vi.fn(),
  loginOrigin: vi.fn(),
  migratePreferences: vi.fn(),
  requestPlcToken: vi.fn(),
  uploadBlobs: vi.fn(),
  validatePlcToken: vi.fn(),
  loginDest: vi.fn(),
}));

import {
  checkIfDidExistsInDest,
  exportRepo,
  loginOrigin,
  loginDest,
  validatePlcToken,
} from "~/actions";
import { processBackgroundJobStage } from "~/util/jobs";
import { redisDelIfValueMatches, redisSetNxEx } from "~/util/redis";
import { processState } from "~/util/process-state";
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

const buildLoginFormData = (): FormData => {
  const fd = new FormData();
  fd.set("bsky-handle", "alice.bsky.social");
  fd.set("bsky-password", "origin-pw");
  fd.set("northsky-handle", "alice.northsky.social");
  fd.set("northsky-password", "dest-pw");
  return fd;
};

const buildPlcMigrationSession = (): AnySession =>
  buildSession({
    do_journey: "migrate",
    inviteCode: "invite123",
    hasBackup: true,
    token_origin: "tok-origin",
    token_dest: "tok-dest",
    handle_dest: "alice.northsky.social",
    pds_dest: "https://northsky.social",
    pds_origin: "https://bsky.social",
    exportedRepo: true,
    importedRepo: true,
    exportedBlobs: true,
    importedBlobs: true,
    migratedPrefs: true,
    user_recover_key: "recovery-key",
    requestedPlcToken: true,
    destActivated: true,
    originDeactivated: true,
    migratedPlc: false,
    did: "did:plc:alice",
  });

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe("processState", () => {
  beforeEach(() => {
    vi.mocked(loginOrigin).mockReset();
    vi.mocked(loginDest).mockReset();
    vi.mocked(validatePlcToken).mockReset();
    vi.mocked(checkIfDidExistsInDest).mockReset();
    vi.mocked(processBackgroundJobStage).mockReset();

    vi.mocked(loginOrigin).mockResolvedValue({
      token_origin: "tok-origin",
      email: "alice@example.com",
      did: "did:plc:alice",
      atp_origin_session: { foo: "bar" },
    } as never);
    vi.mocked(loginDest).mockResolvedValue({
      token_dest: "tok-dest",
      atp_dest_session: { baz: "qux" },
    } as never);
    // Simulate the dest account being already active in Northsky.
    vi.mocked(checkIfDidExistsInDest).mockResolvedValue({
      didExists: true,
      didActive: true,
    });
    vi.mocked(processBackgroundJobStage).mockResolvedValue(undefined);
    vi.mocked(redisSetNxEx).mockReset();
    vi.mocked(redisDelIfValueMatches).mockReset();
  });

  it("missing-blobs journey proceeds with loginDest even when dest account is already active", async () => {
    const session = buildSession({
      do_journey: "missing-blobs",
      pds_dest: "https://northsky.social",
    });

    await processState(session, buildLoginFormData(), "https://migrator.example.com");

    expect(checkIfDidExistsInDest).toHaveBeenCalledWith("did:plc:alice", "https://northsky.social");
    expect(loginDest).toHaveBeenCalledTimes(1);
    expect(loginDest).toHaveBeenCalledWith(
      expect.objectContaining({
        did: "did:plc:alice",
        pds_dest: "https://northsky.social",
        handle_dest: "alice.northsky.social",
        password_dest: "dest-pw",
      }),
    );
    expect(session.get("token_dest")).toBe("tok-dest");
    expect(session.get("did_active_in_dest")).toBe(true);
  });

  it("removes leading at-signs from origin and destination login handles", async () => {
    const session = buildSession({
      do_journey: "missing-blobs",
      pds_dest: "https://northsky.social",
    });
    const data = buildLoginFormData();
    data.set("bsky-handle", "@example.northsky.social");
    data.set("northsky-handle", "@example.northsky.social");

    await processState(session, data, "https://migrator.example.com");

    expect(loginOrigin).toHaveBeenCalledWith(
      expect.objectContaining({
        handle_origin: "example.northsky.social",
      }),
    );
    expect(loginDest).toHaveBeenCalledWith(
      expect.objectContaining({
        handle_dest: "example.northsky.social",
      }),
    );
    expect(session.get("handle_origin")).toBe("example.northsky.social");
    expect(session.get("handle_dest")).toBe("example.northsky.social");
  });

  it("resume journey does NOT call loginDest when dest account is already active", async () => {
    const session = buildSession({
      do_journey: "resume",
      pds_dest: "https://northsky.social",
    });

    await processState(session, buildLoginFormData(), "https://migrator.example.com");

    expect(checkIfDidExistsInDest).toHaveBeenCalledTimes(1);
    expect(loginDest).not.toHaveBeenCalled();
    expect(session.get("did_active_in_dest")).toBe(true);
    expect(session.get("token_dest")).toBeUndefined();
  });

  it("routes EXPORT_REPO_ORIGIN through processBackgroundJobStage with export-repo config", async () => {
    const session = buildSession({
      do_journey: "migrate",
      inviteCode: "invite123",
      hasBackup: true,
      token_origin: "tok-origin",
      did: "did:plc:alice",
      pds_origin: "https://bsky.social",
      token_dest: "tok-dest",
      handle_dest: "alice.northsky.social",
      pds_dest: "https://northsky.social",
      exportedRepo: false,
    });

    await processState(session, new FormData(), "https://migrator.example.com");

    expect(processBackgroundJobStage).toHaveBeenCalledTimes(1);
    const config = vi.mocked(processBackgroundJobStage).mock.calls[0]?.[2];
    expect(config).toMatchObject({
      jobIdKey: "export_repo_job_id",
      progressKey: "export_repo_progress",
      lastCheckKey: "last_export_repo_check",
      failuresKey: "export_repo_job_failures",
      completedKey: "exportedRepo",
      jobKind: "ExportRepo",
    });
    expect(config?.startJob).toBe(exportRepo);
  });

  it("clears background job state when resetting a resume", async () => {
    const session = buildSession({
      do_journey: "migrate",
      inviteCode: "invite123",
      export_job_id: "export-job",
      export_progress: { invalid_blobs: 1, successful_blobs: 2, total: 3 },
      export_job_failures: 2,
      last_export_check: 100,
      export_repo_job_id: "repo-job",
      import_job_id: "import-job",
      upload_progress: { invalid_blobs: 0, successful_blobs: 1, total: 2 },
      import_job_failures: 2,
      last_import_check: 200,
    });
    const data = new FormData();
    data.set("reset-resume", "reset-resume");

    await processState(session, data, "https://migrator.example.com");

    expect(session.get("export_job_id")).toBeUndefined();
    expect(session.get("export_progress")).toBeUndefined();
    expect(session.get("export_job_failures")).toBeUndefined();
    expect(session.get("last_export_check")).toBeUndefined();
    expect(session.get("export_repo_job_id")).toBeUndefined();
    expect(session.get("import_job_id")).toBeUndefined();
    expect(session.get("upload_progress")).toBeUndefined();
    expect(session.get("import_job_failures")).toBeUndefined();
    expect(session.get("last_import_check")).toBeUndefined();
  });

  it("rejects concurrent PLC migration submissions so only one validates the token", async () => {
    const firstSession = buildPlcMigrationSession();
    const secondSession = buildPlcMigrationSession();
    const firstCall = createDeferred<{ ok: boolean }>();

    vi.mocked(redisSetNxEx).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.mocked(redisDelIfValueMatches).mockResolvedValue(true);
    vi.mocked(validatePlcToken).mockReturnValueOnce(firstCall.promise as never);

    const firstRequest = processState(firstSession, new FormData(), "https://migrator.example.com");
    await Promise.resolve();

    const secondRequest = processState(
      secondSession,
      new FormData(),
      "https://migrator.example.com",
    );

    firstCall.resolve({ ok: true });

    await Promise.all([firstRequest, secondRequest]);

    expect(redisSetNxEx).toHaveBeenCalledTimes(2);
    expect(validatePlcToken).toHaveBeenCalledTimes(1);
    expect(redisDelIfValueMatches).toHaveBeenCalledTimes(1);
    expect(firstSession.get("migratedPlc")).toBe(true);
    expect(secondSession.get("migratedPlc")).toBe(false);
  });
});
