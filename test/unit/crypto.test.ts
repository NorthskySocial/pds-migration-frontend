import { toBase64 } from "~/util/crypto";

describe("crypto utilities", () => {
  describe("toBase64", () => {
    it("should convert an empty Uint8Array to empty string", () => {
      const input = new Uint8Array([]);
      expect(toBase64(input)).toBe("");
    });

    it("should convert a simple byte array to base64", () => {
      // "Hello" in bytes
      const input = new Uint8Array([72, 101, 108, 108, 111]);
      expect(toBase64(input)).toBe("SGVsbG8=");
    });

    it("should convert binary data to base64", () => {
      // Some binary data
      const input = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
      const result = toBase64(input);
      // Verify it's valid base64 by decoding
      expect(result).toBe("AAECA//+/Q==");
    });

    it("should handle single byte", () => {
      const input = new Uint8Array([65]); // 'A'
      expect(toBase64(input)).toBe("QQ==");
    });

    it("should handle two bytes", () => {
      const input = new Uint8Array([65, 66]); // 'AB'
      expect(toBase64(input)).toBe("QUI=");
    });

    it("should handle three bytes (no padding needed)", () => {
      const input = new Uint8Array([65, 66, 67]); // 'ABC'
      expect(toBase64(input)).toBe("QUJD");
    });

    it("should handle all zero bytes", () => {
      const input = new Uint8Array([0, 0, 0]);
      expect(toBase64(input)).toBe("AAAA");
    });

    it("should handle all 255 bytes", () => {
      const input = new Uint8Array([255, 255, 255]);
      expect(toBase64(input)).toBe("////");
    });
  });
});
