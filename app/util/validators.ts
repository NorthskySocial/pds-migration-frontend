/**
 * Validation utilities for account creation and login flows.
 */

/**
 * Minimum password length required for account creation
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Default domain to append to handles without a domain
 */
export const DEFAULT_HANDLE_DOMAIN = ".northsky.social";

/**
 * Default domain to append to Bluesky (origin PDS) handles without a domain
 */
export const BSKY_HANDLE_DOMAIN = ".bsky.social";

/**
 * Default Bluesky origin PDS URL
 */
export const BSKY_PDS_URL = "https://bsky.social";

/**
 * Checks if a password meets the minimum length requirement.
 * Only validates if the password has been entered (length > 0).
 * @param password - The password to validate
 * @param minLength - Minimum required length (default: 8)
 * @returns true if password is too short, false otherwise
 */
export function isPasswordTooShort(
  password: string,
  minLength: number = MIN_PASSWORD_LENGTH
): boolean {
  return password.length > 0 && password.length < minLength;
}

/**
 * Checks if password and confirmation password match.
 * Only validates when both passwords have been entered.
 * @param password - The password
 * @param confirmPassword - The confirmation password
 * @returns true if passwords don't match (and both have content), false otherwise
 */
export function doPasswordsMismatch(
  password: string,
  confirmPassword: string
): boolean {
  return (
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password !== confirmPassword
  );
}

/**
 * Normalizes a handle by appending the default domain if needed.
 * - For creation flow: always appends the default domain
 * - For migration flow: appends default domain only if no custom domain is present
 * @param handle - The raw handle input from the user
 * @param isCreationFlow - Whether the user is in the new account creation flow
 * @param defaultDomain - Domain to append (default: .northsky.social)
 * @returns Normalized handle with domain
 */
export function normalizeHandle(
  handle: string,
  isCreationFlow: boolean,
  defaultDomain: string = DEFAULT_HANDLE_DOMAIN
): string {
  const normalizedHandle = handle.toLowerCase();

  // In creation flow, always use the default domain
  // In migration flow, only append if no custom domain is present
  if (isCreationFlow || !normalizedHandle.includes(".")) {
    return normalizedHandle.concat(defaultDomain);
  }

  return normalizedHandle;
}

/**
 * Autocompletes a Bluesky (origin PDS) handle when the user is logging into
 * the default Bluesky PDS and entered a handle without a domain.
 *
 * @param handle - The raw handle input from the user
 * @param pds_origin - The origin PDS URL the user is logging into
 * @returns Possibly autocompleted handle
 */
export function maybeAutocompleteBskyHandle(
  handle: string,
  pds_origin: string
): string {
  if (!handle) return handle;
  if (pds_origin !== BSKY_PDS_URL) return handle;
  if (handle.includes(".")) return handle;

  return normalizeHandle(handle, false, BSKY_HANDLE_DOMAIN);
}

/**
 * Returns true if all arguments are truthy.
 * @param items - Values to check for truthiness
 * @returns true if all items are truthy, false otherwise
 */
export function all(
  ...items: (string | boolean | undefined | null)[]
): boolean {
  return items.every((i) => i);
}
