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

vi.mock("~/util/discord", () => ({
  sendDiscordMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/util/jobs", () => ({
  processBackgroundJobStage: vi.fn().mockResolvedValue(undefined),
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
} from "~/actions";
import { processBackgroundJobStage } from "~/util/jobs";
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

describe("processState", () => {
  beforeEach(() => {
    vi.mocked(loginOrigin).mockReset();
    vi.mocked(loginDest).mockReset();
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
  });

  it("missing-blobs journey proceeds with loginDest even when dest account is already active", async () => {
    const session = buildSession({
      do_journey: "missing-blobs",
      pds_dest: "https://northsky.social",
    });

    await processState(session, buildLoginFormData(), "https://migrator.example.com");

    expect(checkIfDidExistsInDest).toHaveBeenCalledWith(
      "did:plc:alice",
      "https://northsky.social",
    );
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
});
