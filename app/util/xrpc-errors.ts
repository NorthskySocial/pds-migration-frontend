import { XRPCError } from "@atproto/api";
import { ResponseType } from '@atproto/xrpc'

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
 * Check if an XRPCError indicates the user provided invalid login
 * credentials (wrong identifier/handle or password).
 */
export function isInvalidCredentialsError(error: unknown): boolean {
  if (!(error instanceof XRPCError)) {
    return false;
  }

  if (error.status !== ResponseType.AuthenticationRequired) {
    return false;
  }

  return error.error === "AuthenticationRequired";
}

/**
 * Check if an XRPCError is a server error (5xx status code), an internal
 * server error coming from a PDS.
 */
export function isRetryableServerError(error: unknown): boolean {
  if (!(error instanceof XRPCError)) {
    return false;
  }

  return error.status >= ResponseType.InternalServerError;
}

/**
 * Check if an error indicates a network-level failure reaching a PDS
 * (e.g. invalid hostname, DNS failure, connection refused, TLS errors).
 */
export function isUnreachableHostError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = (error as { message?: unknown }).message;
  if (typeof message === "string" && message.toLowerCase().includes("fetch failed")) {
    return true;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (cause && typeof cause === "object") {
    const code = (cause as { code?: unknown }).code;
    if (typeof code === "string" && UNREACHABLE_HOST_ERROR_CODES.has(code)) {
      return true;
    }

    // Recurse through wrapped causes
    if (isUnreachableHostError(cause)) {
      return true;
    }
  }

  const errors = (error as { errors?: unknown }).errors;
  if (Array.isArray(errors)) {
    for (const inner of errors) {
      if (isUnreachableHostError(inner)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Network-level error codes (undici/DNS layer) that indicate the
 * PDS hostname is unreachable.
 */
const UNREACHABLE_HOST_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "CERT_HAS_EXPIRED",
]);

/**
 * Generic prefix used for 5xx backend responses.
 */
export const BACKEND_SERVER_ERROR_PREFIX =
  "We hit a server error during your migration. \
Please try again in a few minutes, or contact Support if the problem persists.";

/**
 * Builds a user-friendly error message from a non-OK backend Response.
 */
export async function formatBackendErrorMessage(res: Response): Promise<string> {
  let errorMessage: string;

  try {
    const errorData = (await res.json()) as { message?: string };
    errorMessage = errorData?.message ?? `HTTP ${res.status}: ${res.statusText}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_jsonError) {
    try {
      const textContent = await res.text();
      errorMessage = `Server error: ${textContent.substring(0, 200)}...`;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_textError) {
      errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    }
  }

  if (res.status >= 500) {
    return `${BACKEND_SERVER_ERROR_PREFIX} (details: ${errorMessage})`;
  }

  return errorMessage;
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
  UNREACHABLE_ORIGIN_PDS:
    "We couldn't reach your origin PDS. Please double-check the PDS URL you entered \
and make sure the service is online, then try again.",
  UNREACHABLE_DEST_PDS:
    "We couldn't reach the Northsky PDS. Please try again in a few minutes. \
If the problem persists, please contact Support.",
} as const;
