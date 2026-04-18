import {
  isPasswordTooShort,
  doPasswordsMismatch,
  normalizeHandle,
  MIN_PASSWORD_LENGTH,
  DEFAULT_HANDLE_DOMAIN,
} from "~/util/validators";

describe("validators", () => {
  describe("constants", () => {
    it("should have MIN_PASSWORD_LENGTH of 8", () => {
      expect(MIN_PASSWORD_LENGTH).toBe(8);
    });

    it("should have DEFAULT_HANDLE_DOMAIN of .northsky.social", () => {
      expect(DEFAULT_HANDLE_DOMAIN).toBe(".northsky.social");
    });
  });

  describe("isPasswordTooShort", () => {
    it("should return true for password shorter than 8 characters", () => {
      expect(isPasswordTooShort("short")).toBe(true);
      expect(isPasswordTooShort("1234567")).toBe(true);
    });

    it("should return false for password exactly 8 characters", () => {
      expect(isPasswordTooShort("12345678")).toBe(false);
    });

    it("should return false for password longer than 8 characters", () => {
      expect(isPasswordTooShort("longerpassword")).toBe(false);
    });

    it("should return false for empty password", () => {
      expect(isPasswordTooShort("")).toBe(false);
    });

    it("should respect custom minimum length", () => {
      expect(isPasswordTooShort("abc", 5)).toBe(true);
      expect(isPasswordTooShort("abcde", 5)).toBe(false);
      expect(isPasswordTooShort("abcdef", 5)).toBe(false);
    });
  });

  describe("doPasswordsMismatch", () => {
    it("should return true when passwords do not match", () => {
      expect(doPasswordsMismatch("password1", "password2")).toBe(true);
    });

    it("should return false when passwords match", () => {
      expect(doPasswordsMismatch("password", "password")).toBe(false);
    });

    it("should return false when password is empty", () => {
      expect(doPasswordsMismatch("", "password")).toBe(false);
    });

    it("should return false when confirm password is empty", () => {
      expect(doPasswordsMismatch("password", "")).toBe(false);
    });

    it("should return false when both passwords are empty", () => {
      expect(doPasswordsMismatch("", "")).toBe(false);
    });
  });

  describe("normalizeHandle", () => {
    it("should append default domain in creation flow", () => {
      expect(normalizeHandle("myhandle", true)).toBe("myhandle.northsky.social");
    });

    it("should append default domain even if handle has custom domain in creation flow", () => {
      expect(normalizeHandle("myhandle.custom.com", true)).toBe(
        "myhandle.custom.com.northsky.social"
      );
    });

    it("should append default domain in migration flow when no domain present", () => {
      expect(normalizeHandle("myhandle", false)).toBe("myhandle.northsky.social");
    });

    it("should preserve custom domain in migration flow", () => {
      expect(normalizeHandle("myhandle.custom.com", false)).toBe(
        "myhandle.custom.com"
      );
    });

    it("should convert handle to lowercase", () => {
      expect(normalizeHandle("MyHandle", true)).toBe("myhandle.northsky.social");
      expect(normalizeHandle("MYHANDLE.Custom.COM", false)).toBe(
        "myhandle.custom.com"
      );
    });

    it("should use custom default domain when provided", () => {
      expect(normalizeHandle("myhandle", true, ".example.com")).toBe(
        "myhandle.example.com"
      );
    });

    it("should handle empty handle", () => {
      expect(normalizeHandle("", true)).toBe(".northsky.social");
    });
  });
});
