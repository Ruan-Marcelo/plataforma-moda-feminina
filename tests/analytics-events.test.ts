// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it } from "vitest";
import { analyticsEventSchema } from "@/features/analytics/events";

describe("analyticsEventSchema", () => {
  it("accepts a consented minimal event", () => {
    expect(analyticsEventSchema.parse({ name: "page_view", anonymousId: "anonymous-session-1234", analyticsConsent: true }).name).toBe("page_view");
  });

  it("rejects events without analytics consent or with unknown names", () => {
    expect(() => analyticsEventSchema.parse({ name: "unknown", anonymousId: "anonymous-session-1234", analyticsConsent: true })).toThrow();
    expect(() => analyticsEventSchema.parse({ name: "page_view", anonymousId: "anonymous-session-1234", analyticsConsent: false })).toThrow();
  });
});
