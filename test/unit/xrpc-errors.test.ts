import { XRPCError } from "@atproto/api";
import {
  formatBackendErrorMessage,
  BACKEND_SERVER_ERROR_PREFIX,
  isInvalidInviteCodeError,
  isRetryableServerError,
  isUnreachableHostError,
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

    it("has UNREACHABLE_ORIGIN_PDS message", () => {
      expect(XRPC_ERROR_MESSAGES.UNREACHABLE_ORIGIN_PDS).toContain("PDS");
      expect(XRPC_ERROR_MESSAGES.UNREACHABLE_ORIGIN_PDS).toContain("try again");
    });

    it("has UNREACHABLE_DEST_PDS message", () => {
      expect(XRPC_ERROR_MESSAGES.UNREACHABLE_DEST_PDS).toContain("Northsky PDS");
    });
  });

  describe("isUnreachableHostError", () => {
    it("returns true for TypeError with 'fetch failed' message", () => {
      const error = new TypeError("fetch failed");
      expect(isUnreachableHostError(error)).toBe(true);
    });

    it("returns true when cause has an unreachable code (ENOTFOUND)", () => {
      const error = new Error("Some wrapped error");
      (error as Error & { cause: unknown }).cause = { code: "ENOTFOUND" };
      expect(isUnreachableHostError(error)).toBe(true);
    });

    it("returns true when cause has ECONNREFUSED code", () => {
      const error = new Error("connection failure");
      (error as Error & { cause: unknown }).cause = { code: "ECONNREFUSED" };
      expect(isUnreachableHostError(error)).toBe(true);
    });

    it("returns true for nested causes", () => {
      const error = new Error("outer");
      (error as Error & { cause: unknown }).cause = {
        message: "inner",
        cause: { code: "EAI_AGAIN" },
      };
      expect(isUnreachableHostError(error)).toBe(true);
    });

    it("returns true when AggregateError-like errors array contains a match", () => {
      const error = new Error("aggregate");
      (error as Error & { errors: unknown[] }).errors = [
        { message: "fetch failed" },
      ];
      expect(isUnreachableHostError(error)).toBe(true);
    });

    it("returns false for unrelated errors", () => {
      expect(isUnreachableHostError(new Error("something else"))).toBe(false);
    });

    it("returns false for non-objects", () => {
      expect(isUnreachableHostError(null)).toBe(false);
      expect(isUnreachableHostError(undefined)).toBe(false);
      expect(isUnreachableHostError("fetch failed")).toBe(false);
    });

    it("returns false for unknown cause codes", () => {
      const error = new Error("oops");
      (error as Error & { cause: unknown }).cause = { code: "ESOMETHING" };
      expect(isUnreachableHostError(error)).toBe(false);
    });
  });

  describe("formatBackendErrorMessage", () => {
    const buildResponse = ({
      status,
      statusText = "",
      json,
      text,
    }: {
      status: number;
      statusText?: string;
      json?: () => Promise<unknown>;
      text?: () => Promise<string>;
    }): Response =>
      ({
        status,
        statusText,
        json: json ?? (() => Promise.reject(new SyntaxError("invalid json"))),
        text: text ?? (() => Promise.resolve("")),
      }) as unknown as Response;

    it("returns the JSON body's `message` field for non-5xx responses", async () => {
      const res = buildResponse({
        status: 400,
        json: () => Promise.resolve({ message: "invite code not available" }),
      });

      await expect(formatBackendErrorMessage(res)).resolves.toBe(
        "invite code not available"
      );
    });

    it("falls back to truncated text body when JSON parsing fails (non-5xx)", async () => {
      const longText = "x".repeat(300);
      const res = buildResponse({
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve(longText),
      });

      const result = await formatBackendErrorMessage(res);
      expect(result.startsWith("Server error: ")).toBe(true);
      expect(result.endsWith("...")).toBe(true);
      // 200-char truncation of the text body
      expect(result).toContain("x".repeat(200));
      expect(result).not.toContain("x".repeat(201));
    });

    it("falls back to HTTP status when both JSON and text fail", async () => {
      const res = buildResponse({
        status: 418,
        statusText: "I'm a teapot",
        text: () => Promise.reject(new Error("body already used")),
      });

      await expect(formatBackendErrorMessage(res)).resolves.toBe(
        "HTTP 418: I'm a teapot"
      );
    });

    it("wraps 5xx responses with the support-pointing prefix and includes the detail", async () => {
      const res = buildResponse({
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ code: "Runtime", message: "IO error" }),
      });

      const result = await formatBackendErrorMessage(res);
      expect(result.startsWith(BACKEND_SERVER_ERROR_PREFIX)).toBe(true);
      expect(result).toContain("(details: IO error)");
    });

    it("wraps 5xx responses with prefix even when detail comes from text fallback", async () => {
      const res = buildResponse({
        status: 503,
        statusText: "Service Unavailable",
        text: () => Promise.resolve("upstream timeout"),
      });

      const result = await formatBackendErrorMessage(res);
      expect(result.startsWith(BACKEND_SERVER_ERROR_PREFIX)).toBe(true);
      expect(result).toContain("(details: Server error: upstream timeout...)");
    });

    it("wraps 5xx responses with prefix when both JSON and text fail", async () => {
      const res = buildResponse({
        status: 502,
        statusText: "Bad Gateway",
        text: () => Promise.reject(new Error("body already used")),
      });

      const result = await formatBackendErrorMessage(res);
      expect(result.startsWith(BACKEND_SERVER_ERROR_PREFIX)).toBe(true);
      expect(result).toContain("(details: HTTP 502: Bad Gateway)");
    });

    it("uses status fallback when JSON body has no `message` field (non-5xx)", async () => {
      const res = buildResponse({
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ code: "NotFound" }),
      });

      await expect(formatBackendErrorMessage(res)).resolves.toBe(
        "HTTP 404: Not Found"
      );
    });
  });
});
