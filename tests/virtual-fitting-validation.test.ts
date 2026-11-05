// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it } from "vitest";
import { hasSupportedImageSignature } from "@/features/virtual-fitting/validation";
describe("virtual try-on upload validation", () => {
  it("checks signatures instead of trusting extensions", () => {
    expect(hasSupportedImageSignature(new Uint8Array([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBe(true);
    expect(hasSupportedImageSignature(new Uint8Array([0x00, 0x00, 0x00, 0x00]), "image/jpeg")).toBe(false);
  });
  it("supports PNG and WebP signatures", () => {
    expect(hasSupportedImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(hasSupportedImageSignature(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), "image/webp")).toBe(true);
  });
});
