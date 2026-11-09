// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it } from "vitest";
import { createWhatsAppLink } from "@/lib/whatsapp";
describe("createWhatsAppLink", () => {
  it("encodes accents and reserved characters once", () => {
    const name = "Vestido Bordô & Seda + edição #1?";
    const productUrl = "https://example.com/produto/aurora?cor=bordo&size=P";
    const url = new URL(createWhatsAppLink("5511999999999", name, productUrl));
    expect(url.origin).toBe("https://wa.me");
    expect(url.searchParams.size).toBe(1);
    expect(url.searchParams.get("text")).toContain(name);
    expect(url.searchParams.get("text")).toContain(productUrl);
  });
  it("rejects invalid numbers and unsafe product links", () => {
    for (const number of ["123", "0000000000", "+5511999999999", "5511999999999?text=bad"]) expect(() => createWhatsAppLink(number)).toThrow();
    for (const url of ["javascript:alert(1)", "data:image/jpeg;base64,abc", "https://user:password@example.com"]) expect(() => createWhatsAppLink("5511999999999", "Peça", url)).toThrow();
  });
});
