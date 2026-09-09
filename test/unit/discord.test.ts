import { afterEach, describe, expect, it, vi } from "vitest";
import { getProfileUrl } from "~/util/discord";

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
