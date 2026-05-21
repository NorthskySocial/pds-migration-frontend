import { getStage } from "~/util/get-stage";
import { STAGES } from "~/util/stages";
import type { SessionData } from "~/sessions.server";

/**
 * Creates a base session with all boolean defaults set to false
 */
function createBaseSession(overrides: Partial<SessionData> = {}): SessionData {
  return {
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
    ...overrides,
  };
}

describe("getStage", () => {
  describe("no journey started", () => {
    it("should return INVITE_CODE when no inviteCode and no journey", () => {
      const session = createBaseSession();
      expect(getStage(session)).toBe(STAGES.INVITE_CODE);
    });

    it("should return INVITE_CODE when inviteCode is undefined", () => {
      const session = createBaseSession({ inviteCode: undefined });
      expect(getStage(session)).toBe(STAGES.INVITE_CODE);
    });
  });

  describe("create journey", () => {
    it("should return CREATE_DEST_ACCOUNT when starting create journey", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "create",
      });
      expect(getStage(session)).toBe(STAGES.CREATE_DEST_ACCOUNT);
    });

    it("should return CREATE_DEST_ACCOUNT when token_dest is missing", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "create",
        handle_dest: "user.northsky.social",
      });
      expect(getStage(session)).toBe(STAGES.CREATE_DEST_ACCOUNT);
    });

    it("should return CREATE_DEST_ACCOUNT when handle_dest is missing", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "create",
        token_dest: "token123",
      });
      expect(getStage(session)).toBe(STAGES.CREATE_DEST_ACCOUNT);
    });

    it("should return GENERATE_RECOVERY_KEY when account created but no recovery key", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "create",
        token_dest: "token123",
        handle_dest: "user.northsky.social",
        user_recover_key: undefined,
      });
      expect(getStage(session)).toBe(STAGES.GENERATE_RECOVERY_KEY);
    });

    it("should return DONE when recovery key is set (including null)", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "create",
        token_dest: "token123",
        handle_dest: "user.northsky.social",
        user_recover_key: null, // User declined to generate
      });
      expect(getStage(session)).toBe(STAGES.DONE);
    });

    it("should return DONE when recovery key has value", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "create",
        token_dest: "token123",
        handle_dest: "user.northsky.social",
        user_recover_key: "recovery-key-123",
      });
      expect(getStage(session)).toBe(STAGES.DONE);
    });
  });

  describe("migrate journey", () => {
    it("should return BACKUP_NOTICE when starting migrate journey without backup", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: false,
      });
      expect(getStage(session)).toBe(STAGES.BACKUP_NOTICE);
    });

    it("should return ORIGIN_PDS_LOGIN after backup confirmed", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
      });
      expect(getStage(session)).toBe(STAGES.ORIGIN_PDS_LOGIN);
    });

    it("should return CREATE_DEST_ACCOUNT after origin login", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
      });
      expect(getStage(session)).toBe(STAGES.CREATE_DEST_ACCOUNT);
    });

    it("should return EXPORT_REPO_ORIGIN after dest account created", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
      });
      expect(getStage(session)).toBe(STAGES.EXPORT_REPO_ORIGIN);
    });

    it("should return IMPORT_REPO_DEST after repo exported", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
      });
      expect(getStage(session)).toBe(STAGES.IMPORT_REPO_DEST);
    });

    it("should return EXPORT_BLOBS_ORIGIN after repo imported", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
      });
      expect(getStage(session)).toBe(STAGES.EXPORT_BLOBS_ORIGIN);
    });

    it("should return IMPORT_BLOBS_DEST after blobs exported", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
      });
      expect(getStage(session)).toBe(STAGES.IMPORT_BLOBS_DEST);
    });

    it("should return MIGRATE_PREFERENCES after blobs imported", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
      });
      expect(getStage(session)).toBe(STAGES.MIGRATE_PREFERENCES);
    });

    it("should return GENERATE_RECOVERY_KEY after preferences migrated", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
        migratedPrefs: true,
      });
      expect(getStage(session)).toBe(STAGES.GENERATE_RECOVERY_KEY);
    });

    it("should return REQUEST_PLC after recovery key step", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
        migratedPrefs: true,
        user_recover_key: null,
      });
      expect(getStage(session)).toBe(STAGES.REQUEST_PLC);
    });

    it("should return ACTIVATE_DEST after PLC token requested", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
        migratedPrefs: true,
        user_recover_key: null,
        requestedPlcToken: true,
      });
      expect(getStage(session)).toBe(STAGES.ACTIVATE_DEST);
    });

    it("should return DEACTIVATE_ORIGIN after dest activated", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
        migratedPrefs: true,
        user_recover_key: null,
        requestedPlcToken: true,
        destActivated: true,
      });
      expect(getStage(session)).toBe(STAGES.DEACTIVATE_ORIGIN);
    });

    it("should return MIGRATE_PLC after origin deactivated", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
        migratedPrefs: true,
        user_recover_key: null,
        requestedPlcToken: true,
        destActivated: true,
        originDeactivated: true,
      });
      expect(getStage(session)).toBe(STAGES.MIGRATE_PLC);
    });

    it("should return DONE when migration complete", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: "migrate",
        hasBackup: true,
        token_origin: "origin-token",
        did: "did:plc:abc123",
        pds_origin: "https://bsky.social",
        token_dest: "dest-token",
        handle_dest: "user.northsky.social",
        pds_dest: "https://northsky.social",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
        migratedPrefs: true,
        user_recover_key: null,
        requestedPlcToken: true,
        destActivated: true,
        originDeactivated: true,
        migratedPlc: true,
      });
      expect(getStage(session)).toBe(STAGES.DONE);
    });
  });

  describe("resume journey", () => {
    it("should return RESUME_MIGRATION when starting resume without tokens", () => {
      const session = createBaseSession({
        do_journey: "resume",
      });
      expect(getStage(session)).toBe(STAGES.RESUME_MIGRATION);
    });

    it("should return RESUME_MIGRATION when only origin token present", () => {
      const session = createBaseSession({
        do_journey: "resume",
        token_origin: "origin-token",
      });
      expect(getStage(session)).toBe(STAGES.RESUME_MIGRATION);
    });

    it("should return EXPORT_REPO_ORIGIN after both tokens present", () => {
      const session = createBaseSession({
        do_journey: "resume",
        token_origin: "origin-token",
        token_dest: "dest-token",
      });
      expect(getStage(session)).toBe(STAGES.EXPORT_REPO_ORIGIN);
    });

    it("should return IMPORT_REPO_DEST after repo exported", () => {
      const session = createBaseSession({
        do_journey: "resume",
        token_origin: "origin-token",
        token_dest: "dest-token",
        exportedRepo: true,
      });
      expect(getStage(session)).toBe(STAGES.IMPORT_REPO_DEST);
    });

    it("should return EXPORT_BLOBS_ORIGIN after repo imported", () => {
      const session = createBaseSession({
        do_journey: "resume",
        token_origin: "origin-token",
        token_dest: "dest-token",
        exportedRepo: true,
        importedRepo: true,
      });
      expect(getStage(session)).toBe(STAGES.EXPORT_BLOBS_ORIGIN);
    });

    it("should return IMPORT_BLOBS_DEST after blobs exported", () => {
      const session = createBaseSession({
        do_journey: "resume",
        token_origin: "origin-token",
        token_dest: "dest-token",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
      });
      expect(getStage(session)).toBe(STAGES.IMPORT_BLOBS_DEST);
    });

    it("should return MIGRATE_PREFERENCES after blobs imported", () => {
      const session = createBaseSession({
        do_journey: "resume",
        token_origin: "origin-token",
        token_dest: "dest-token",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
      });
      expect(getStage(session)).toBe(STAGES.MIGRATE_PREFERENCES);
    });

    it("should return GENERATE_RECOVERY_KEY after prefs migrated", () => {
      const session = createBaseSession({
        do_journey: "resume",
        token_origin: "origin-token",
        token_dest: "dest-token",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
        migratedPrefs: true,
      });
      expect(getStage(session)).toBe(STAGES.GENERATE_RECOVERY_KEY);
    });

    it("should return REQUEST_PLC after recovery key step", () => {
      const session = createBaseSession({
        do_journey: "resume",
        token_origin: "origin-token",
        token_dest: "dest-token",
        exportedRepo: true,
        importedRepo: true,
        exportedBlobs: true,
        importedBlobs: true,
        migratedPrefs: true,
        user_recover_key: null,
      });
      expect(getStage(session)).toBe(STAGES.REQUEST_PLC);
    });
  });

  describe("missing-blobs journey", () => {
    it("should return MISSING_BLOBS_LOGIN when starting without tokens", () => {
      const session = createBaseSession({
        do_journey: "missing-blobs",
      });
      expect(getStage(session)).toBe(STAGES.MISSING_BLOBS_LOGIN);
    });

    it("should return MISSING_BLOBS_LOGIN when only one token present", () => {
      const session = createBaseSession({
        do_journey: "missing-blobs",
        token_dest: "dest-token",
      });
      expect(getStage(session)).toBe(STAGES.MISSING_BLOBS_LOGIN);
    });

    it("should return MISSING_BLOBS_EXPORT after both tokens present", () => {
      const session = createBaseSession({
        do_journey: "missing-blobs",
        token_origin: "origin-token",
        token_dest: "dest-token",
      });
      expect(getStage(session)).toBe(STAGES.MISSING_BLOBS_EXPORT);
    });

    it("should return MISSING_BLOBS_IMPORT after export complete", () => {
      const session = createBaseSession({
        do_journey: "missing-blobs",
        token_origin: "origin-token",
        token_dest: "dest-token",
        exportedBlobs: true,
      });
      expect(getStage(session)).toBe(STAGES.MISSING_BLOBS_IMPORT);
    });

    it("should return MISSING_BLOBS_DONE after import complete", () => {
      const session = createBaseSession({
        do_journey: "missing-blobs",
        token_origin: "origin-token",
        token_dest: "dest-token",
        exportedBlobs: true,
        importedBlobs: true,
      });
      expect(getStage(session)).toBe(STAGES.MISSING_BLOBS_DONE);
    });
  });

  describe("edge cases", () => {
    it("should return DONE for unknown journey with inviteCode", () => {
      const session = createBaseSession({
        inviteCode: "invite123",
        do_journey: undefined,
      });
      expect(getStage(session)).toBe(STAGES.DONE);
    });
  });
});
