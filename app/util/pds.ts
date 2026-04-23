import { logger } from "./logger";

/**
 * Check if a DID exists and is active on a destination PDS.
 * @param did - The DID to check
 * @param pds_dest - The destination PDS URL
 * @returns Object with didExists (true if repo found) and didActive (true if repo is active)
 */
export async function checkIfDidExistsInDest(
  did: string,
  pds_dest: string
): Promise<{ didExists: boolean; didActive: boolean }> {
  try {
    const res = await fetch(`${pds_dest}/xrpc/com.atproto.sync.getRepoStatus?did=${did}`, {
      method: "get",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return { didExists: false, didActive: false };
    }

    const data = (await res.json()) as { active?: boolean };
    return { didExists: true, didActive: data.active === true };
  } catch (e) {
    // Silently fail
    logger.withDid(did).warn(`Error checking if DID exists in dest: ${e}`);
    return { didExists: false, didActive: false };
  }
}
