import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe("optional environment configuration", () => {
  it("accepts blank optional credentials and disables S3 path-style when set to false", async () => {
    for (const key of ["DATABASE_URL", "STORE_WHATSAPP_NUMBER", "AUTH_SECRET", "FASHN_API_KEY", "S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_BASE_URL"]) vi.stubEnv(key, "");
    vi.stubEnv("S3_FORCE_PATH_STYLE", "false");
    const { env } = await import("@/lib/env");
    expect(env.S3_ENDPOINT).toBeUndefined();
    expect(env.FASHN_API_KEY).toBeUndefined();
    expect(env.STORE_WHATSAPP_NUMBER).toBeUndefined();
    expect(env.S3_FORCE_PATH_STYLE).toBe(false);
  });
  it("enables path-style only for true", async () => {
    vi.stubEnv("S3_FORCE_PATH_STYLE", "true");
    const { env } = await import("@/lib/env");
    expect(env.S3_FORCE_PATH_STYLE).toBe(true);
  });
});
