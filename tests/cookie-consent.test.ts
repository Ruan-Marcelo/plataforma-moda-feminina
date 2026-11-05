// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it } from "vitest";
import { parseStoredConsent } from "@/features/cookie-consent/consent";

describe("parseStoredConsent", () => {
  it("aceita somente consentimento com necessarios true", () => {
    expect(parseStoredConsent(JSON.stringify({ necessary: true, analytics: false, marketing: true }))).toEqual({ necessary: true, analytics: false, marketing: true });
  });

  it("descarta conteudo invalido", () => {
    expect(parseStoredConsent(JSON.stringify({ necessary: false, analytics: true, marketing: true }))).toBeNull();
    expect(parseStoredConsent("not-json")).toBeNull();
  });
});
