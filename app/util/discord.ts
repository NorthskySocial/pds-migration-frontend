import { logger } from "./logger";

export const DEFAULT_APP_URL = "https://northsky.app";

export function getProfileUrl(did: string): string {
  return new URL(`/profile/${did}`, process.env.APP_URL || DEFAULT_APP_URL).toString();
}

/**
 * Sends a message to a Discord webhook.
 * Catches and ignores any failures silently.
 *
 * @param message - The message string to send to Discord
 */
export async function sendDiscordMessage(message: string): Promise<void> {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      logger.info("[sendDiscordMessage] Discord webhook URL not configured.");
      return;
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    });
    logger.info("[sendDiscordMessage] Discord message sent successfully!");
  } catch {
    logger.warn("[sendDiscordMessage] Failed to send Discord message!");
  }
}
