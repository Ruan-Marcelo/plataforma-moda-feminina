// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it, vi } from "vitest";
import { consumeRateLimit } from "@/lib/security/rate-limit";

describe("consumeRateLimit", () => {
  it("blocks requests after the configured limit and resets the window", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(consumeRateLimit(key, 2, 1000, 1000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 1000, 1000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 1000, 1000).allowed).toBe(false);
    expect(consumeRateLimit(key, 2, 1000, 2001).allowed).toBe(true);
  });
  it("bounds memory for untrusted keys, refuses excess buckets and reclaims expired windows", async () => {
    vi.resetModules();
    const { consumeRateLimit: limit } = await import("@/lib/security/rate-limit");
    for (let i = 0; i < 10000; i++) expect(limit(`bucket-${i}`, 2, 1000, 1000).allowed).toBe(true);
    expect(limit("overflow", 2, 1000, 1000).allowed).toBe(false);
    expect(limit("bucket-0", 2, 1000, 1000).allowed).toBe(true);
    expect(limit("overflow", 2, 1000, 2001).allowed).toBe(true);
  });
});
