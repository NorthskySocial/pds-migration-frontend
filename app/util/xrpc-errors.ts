import { XRPCError } from "@atproto/api";

/**
 * Check if an XRPCError indicates an invalid or already-used invite code.
 */
export function isInvalidInviteCodeError(error: unknown): boolean {
  if (!(error instanceof XRPCError)) {
    return false;
  }

  return error.message.includes("invite code not available");
}

/**
 * Check if an XRPCError is a server error (5xx status code), an internal
 * server error coming from a PDS.
 */
export function isRetryableServerError(error: unknown): boolean {
  if (!(error instanceof XRPCError)) {
    return false;
  }

  return error.status >= 500;
}

/**
 * User-friendly error messages for XRPC errors during account creation.
 */
export const XRPC_ERROR_MESSAGES = {
  INVALID_INVITE_CODE:
    "The invite code you entered is invalid or has already been used. \
If you previously started your migration to Northsky, please go to the home screen and select Resume migration. \
If you believe this is an error, please contact Support.",
  SERVER_ERROR:
    "We encountered a server error while creating your account on the Northsky PDS. \
Please try again in a few minutes. If the problem persists, please contact Support.",
} as const;
