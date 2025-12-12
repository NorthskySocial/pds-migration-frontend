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
        console.log("[sendDiscordMessage] Discord webhook URL not configured.");
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
      }),
    });
    console.log("[sendDiscordMessage] Discord message sent successfully!");
  } catch {
    console.log("[sendDiscordMessage] Failed to send Discord message!");
  }
}
