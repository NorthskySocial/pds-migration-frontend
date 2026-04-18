import { STAGES, stageInfo } from "~/util/stages";

describe("stages utilities", () => {
  describe("stageInfo", () => {
    it("should have info for all stages", () => {
      const allStages = Object.values(STAGES);
      for (const stage of allStages) {
        expect(stageInfo[stage]).toBeDefined();
        expect(stageInfo[stage]).toHaveProperty("stageIdx");
        expect(stageInfo[stage]).toHaveProperty("stageTitle");
        expect(stageInfo[stage]).toHaveProperty("stageDescription");
      }
    });

    it("should have correct stage indices for migration progress stages", () => {
      expect(stageInfo[STAGES.CREATE_DEST_ACCOUNT].stageIdx).toBe(0);
      expect(stageInfo[STAGES.EXPORT_REPO_ORIGIN].stageIdx).toBe(1);
      expect(stageInfo[STAGES.IMPORT_REPO_DEST].stageIdx).toBe(2);
      expect(stageInfo[STAGES.EXPORT_BLOBS_ORIGIN].stageIdx).toBe(3);
      expect(stageInfo[STAGES.IMPORT_BLOBS_DEST].stageIdx).toBe(4);
      expect(stageInfo[STAGES.MIGRATE_PREFERENCES].stageIdx).toBe(5);
      expect(stageInfo[STAGES.GENERATE_RECOVERY_KEY].stageIdx).toBe(6);
      expect(stageInfo[STAGES.REQUEST_PLC].stageIdx).toBe(7);
      expect(stageInfo[STAGES.RESUME_MIGRATION].stageIdx).toBe(8);
    });

    it("should have -1 index for non-progress stages", () => {
      expect(stageInfo[STAGES.INVITE_CODE].stageIdx).toBe(-1);
      expect(stageInfo[STAGES.MAINTENANCE].stageIdx).toBe(-1);
      expect(stageInfo[STAGES.BACKUP_NOTICE].stageIdx).toBe(-1);
      expect(stageInfo[STAGES.ORIGIN_PDS_LOGIN].stageIdx).toBe(-1);
      expect(stageInfo[STAGES.DONE].stageIdx).toBe(-1);
      expect(stageInfo[STAGES.FAILED].stageIdx).toBe(-1);
    });

    it("should have correct titles for key stages", () => {
      expect(stageInfo[STAGES.MAINTENANCE].stageTitle).toBe("Maintenance");
      expect(stageInfo[STAGES.CREATE_DEST_ACCOUNT].stageTitle).toBe(
        "Creating destination account..."
      );
      expect(stageInfo[STAGES.EXPORT_REPO_ORIGIN].stageTitle).toBe(
        "Exporting repo..."
      );
      expect(stageInfo[STAGES.IMPORT_REPO_DEST].stageTitle).toBe(
        "Importing repo..."
      );
    });

    it("should have correct descriptions for key stages", () => {
      expect(stageInfo[STAGES.MAINTENANCE].stageDescription).toBe(
        "The migration tool is temporarily unavailable"
      );
      expect(stageInfo[STAGES.CREATE_DEST_ACCOUNT].stageDescription).toBe(
        "Initialising a new account on the destination PDS"
      );
      expect(stageInfo[STAGES.REQUEST_PLC].stageDescription).toBe(
        "Almost done! Check your email!"
      );
    });

    it("should have missing blobs stage info", () => {
      expect(stageInfo[STAGES.MISSING_BLOBS_EXPORT].stageIdx).toBe(0);
      expect(stageInfo[STAGES.MISSING_BLOBS_IMPORT].stageIdx).toBe(1);
      expect(stageInfo[STAGES.MISSING_BLOBS_EXPORT].stageTitle).toBe(
        "Exporting missing blobs..."
      );
      expect(stageInfo[STAGES.MISSING_BLOBS_IMPORT].stageTitle).toBe(
        "Importing blobs..."
      );
    });

    it("should have empty strings for non-progress stages", () => {
      expect(stageInfo[STAGES.INVITE_CODE].stageTitle).toBe("");
      expect(stageInfo[STAGES.INVITE_CODE].stageDescription).toBe("");
      expect(stageInfo[STAGES.BACKUP_NOTICE].stageTitle).toBe("");
      expect(stageInfo[STAGES.BACKUP_NOTICE].stageDescription).toBe("");
    });
  });
});
