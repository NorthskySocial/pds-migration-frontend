import { afterEach, describe, expect, it, vi } from "vitest";
import { getProfileUrl, sendDiscordMessage } from "~/util/discord";
import { logger } from "~/util/logger";

vi.mock("~/util/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("sendDiscordMessage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it.each([undefined, ""])("skips the request when the webhook URL is %s", async (url) => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", url);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendDiscordMessage("Migration complete");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "[sendDiscordMessage] Discord webhook URL not configured.",
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("posts the message as JSON to the configured webhook", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.example.com/webhook");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const message = 'Migration complete for "test"\nReady to use';

    await sendDiscordMessage(message);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("https://discord.example.com/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    expect(logger.info).toHaveBeenCalledWith(
      "[sendDiscordMessage] Discord message sent successfully!",
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("logs network failures without rejecting", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.example.com/webhook");
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendDiscordMessage("Migration complete")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      "[sendDiscordMessage] Failed to send Discord message!",
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});

describe("getProfileUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    [undefined, "https://northsky.app"],
    ["", "https://northsky.app"],
    ["https://social.example.com", "https://social.example.com"],
    ["https://social.example.com/", "https://social.example.com"],
  ])("uses APP_URL=%s", (appUrl, expectedUrl) => {
    vi.stubEnv("APP_URL", appUrl);

    expect(getProfileUrl("did:plc:test123")).toBe(`${expectedUrl}/profile/did:plc:test123`);
  });

  it("reads APP_URL on each call", () => {
    vi.stubEnv("APP_URL", "https://first.example.com");
    expect(getProfileUrl("did:plc:test123")).toBe(
      "https://first.example.com/profile/did:plc:test123",
    );

    vi.stubEnv("APP_URL", "https://second.example.com");
    expect(getProfileUrl("did:plc:test123")).toBe(
      "https://second.example.com/profile/did:plc:test123",
    );
  });
});
