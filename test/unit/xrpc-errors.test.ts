import { XRPCError } from "@atproto/api";
import {
  isInvalidInviteCodeError,
  isRetryableServerError,
  XRPC_ERROR_MESSAGES,
} from "~/util/xrpc-errors";

describe("xrpc-errors", () => {
  describe("isInvalidInviteCodeError", () => {
    it("returns true for XRPCError with 'invite code not available' message", () => {
      const error = new XRPCError(
        400,
        "InvalidInviteCode",
        "Provided invite code not available"
      );
      expect(isInvalidInviteCodeError(error)).toBe(true);
    });

    it("returns true when message contains 'invite code not available' anywhere", () => {
      const error = new XRPCError(
        400,
        "InvalidInviteCode",
        "Error: invite code not available for this user"
      );
      expect(isInvalidInviteCodeError(error)).toBe(true);
    });

    it("returns false for XRPCError with different message", () => {
      const error = new XRPCError(400, "InvalidHandle", "Handle already taken");
      expect(isInvalidInviteCodeError(error)).toBe(false);
    });

    it("returns false for non-XRPCError", () => {
      const error = new Error("invite code not available");
      expect(isInvalidInviteCodeError(error)).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isInvalidInviteCodeError(null)).toBe(false);
      expect(isInvalidInviteCodeError(undefined)).toBe(false);
    });

    it("returns false for plain objects", () => {
      const error = { message: "invite code not available", status: 400 };
      expect(isInvalidInviteCodeError(error)).toBe(false);
    });
  });

  describe("isRetryableServerError", () => {
    it("returns true for XRPCError with status 500", () => {
      const error = new XRPCError(500, "InternalServerError", "Internal Server Error");
      expect(isRetryableServerError(error)).toBe(true);
    });

    it("returns true for XRPCError with status 502", () => {
      const error = new XRPCError(502, "BadGateway", "Bad Gateway");
      expect(isRetryableServerError(error)).toBe(true);
    });

    it("returns true for XRPCError with status 503", () => {
      const error = new XRPCError(503, "ServiceUnavailable", "Service Unavailable");
      expect(isRetryableServerError(error)).toBe(true);
    });

    it("returns true for XRPCError with status 504", () => {
      const error = new XRPCError(504, "GatewayTimeout", "Gateway Timeout");
      expect(isRetryableServerError(error)).toBe(true);
    });

    it("returns false for XRPCError with status 400", () => {
      const error = new XRPCError(400, "BadRequest", "Bad Request");
      expect(isRetryableServerError(error)).toBe(false);
    });

    it("returns false for XRPCError with status 401", () => {
      const error = new XRPCError(401, "Unauthorized", "Unauthorized");
      expect(isRetryableServerError(error)).toBe(false);
    });

    it("returns false for XRPCError with status 404", () => {
      const error = new XRPCError(404, "NotFound", "Not Found");
      expect(isRetryableServerError(error)).toBe(false);
    });

    it("returns false for XRPCError with status 499 (edge case)", () => {
      const error = new XRPCError(499, "ClientClosedRequest", "Client Closed Request");
      expect(isRetryableServerError(error)).toBe(false);
    });

    it("returns false for non-XRPCError", () => {
      const error = new Error("Internal Server Error");
      expect(isRetryableServerError(error)).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isRetryableServerError(null)).toBe(false);
      expect(isRetryableServerError(undefined)).toBe(false);
    });

    it("returns false for plain objects with status property", () => {
      const error = { status: 500, message: "Internal Server Error" };
      expect(isRetryableServerError(error)).toBe(false);
    });
  });

  describe("XRPC_ERROR_MESSAGES", () => {
    it("has INVALID_INVITE_CODE message", () => {
      expect(XRPC_ERROR_MESSAGES.INVALID_INVITE_CODE).toContain("invite code");
      expect(XRPC_ERROR_MESSAGES.INVALID_INVITE_CODE).toContain("Resume migration");
      expect(XRPC_ERROR_MESSAGES.INVALID_INVITE_CODE).toContain("contact Support");
    });

    it("has SERVER_ERROR message", () => {
      expect(XRPC_ERROR_MESSAGES.SERVER_ERROR).toContain("server error");
      expect(XRPC_ERROR_MESSAGES.SERVER_ERROR).toContain("try again");
      expect(XRPC_ERROR_MESSAGES.SERVER_ERROR).toContain("contact Support");
    });
  });
});
