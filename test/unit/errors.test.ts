import {
  BaseAppError,
  CreateAccountError,
  MigrationError,
  LoginError,
} from "~/errors";

describe("error classes", () => {
  describe("BaseAppError", () => {
    it("should set message correctly", () => {
      const error = new BaseAppError("Something went wrong");
      expect(error.message).toBe("Something went wrong");
    });

    it("should default to Unexpected errorType", () => {
      const error = new BaseAppError("Something went wrong");
      expect(error.errorType).toBe("Unexpected");
    });

    it("should allow overriding errorType", () => {
      const error = new BaseAppError("Expected error", "Expected");
      expect(error.errorType).toBe("Expected");
    });

    it("should have correct name", () => {
      const error = new BaseAppError("test");
      expect(error.name).toBe("BaseAppError");
    });

    it("should be an instance of Error", () => {
      const error = new BaseAppError("test");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("CreateAccountError", () => {
    it("should set message correctly", () => {
      const error = new CreateAccountError("Failed to create account");
      expect(error.message).toBe("Failed to create account");
    });

    it("should default to Unexpected errorType", () => {
      const error = new CreateAccountError("Failed to create account");
      expect(error.errorType).toBe("Unexpected");
    });

    it("should allow overriding errorType", () => {
      const error = new CreateAccountError("Handle taken", "Expected");
      expect(error.errorType).toBe("Expected");
    });

    it("should have correct name", () => {
      const error = new CreateAccountError("test");
      expect(error.name).toBe("CreateAccountError");
    });

    it("should be an instance of BaseAppError", () => {
      const error = new CreateAccountError("test");
      expect(error).toBeInstanceOf(BaseAppError);
    });
  });

  describe("MigrationError", () => {
    it("should set message correctly", () => {
      const error = new MigrationError("Migration failed");
      expect(error.message).toBe("Migration failed");
    });

    it("should default to Unexpected errorType", () => {
      const error = new MigrationError("Migration failed");
      expect(error.errorType).toBe("Unexpected");
    });

    it("should allow overriding errorType", () => {
      const error = new MigrationError("User cancelled", "Expected");
      expect(error.errorType).toBe("Expected");
    });

    it("should have correct name", () => {
      const error = new MigrationError("test");
      expect(error.name).toBe("MigrationError");
    });

    it("should be an instance of BaseAppError", () => {
      const error = new MigrationError("test");
      expect(error).toBeInstanceOf(BaseAppError);
    });
  });

  describe("LoginError", () => {
    it("should set message correctly", () => {
      const error = new LoginError("Invalid credentials");
      expect(error.message).toBe("Invalid credentials");
    });

    it("should default to Expected errorType", () => {
      const error = new LoginError("Invalid credentials");
      expect(error.errorType).toBe("Expected");
    });

    it("should allow overriding errorType", () => {
      const error = new LoginError("Server error", "Unexpected");
      expect(error.errorType).toBe("Unexpected");
    });

    it("should have correct name", () => {
      const error = new LoginError("test");
      expect(error.name).toBe("LoginError");
    });

    it("should be an instance of BaseAppError", () => {
      const error = new LoginError("test");
      expect(error).toBeInstanceOf(BaseAppError);
    });
  });
});
