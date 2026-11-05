// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it } from "vitest";
import { consumeRateLimit } from "@/lib/security/rate-limit";

describe("consumeRateLimit", () => {
  it("blocks requests after the configured limit and resets the window", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(consumeRateLimit(key, 2, 1000, 1000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 1000, 1000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 1000, 1000).allowed).toBe(false);
    expect(consumeRateLimit(key, 2, 1000, 2001).allowed).toBe(true);
  });
});
