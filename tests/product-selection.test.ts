import { describe, expect, it } from "vitest";
import { createFittingPath, findAvailableVariant, getVariantSizes, productSelectionSchema, selectVariantForColor, type ProductVariant } from "@/features/products/selection";
import { createProductInterestLink } from "@/features/products/interest";

const productId = "cm123456789012345678901234";
const variants: ProductVariant[] = [
  { id: "cm123456789012345678901235", color: "Bordô", colorHex: "#8d263b", size: "P", available: true },
  { id: "cm123456789012345678901236", color: "Bordô", colorHex: "#8d263b", size: "M", available: false },
  { id: "cm123456789012345678901237", color: "Preto", colorHex: null, size: "M", available: true },
  { id: "cm123456789012345678901238", color: "Preto", colorHex: null, size: "G", available: true },
];

describe("product selection", () => {
  it("distinguishes a sold-out size from a nonexistent color/size combination", () => {
    expect(getVariantSizes(variants, "Bordô")).toEqual([
      { size: "P", exists: true, available: true },
      { size: "M", exists: true, available: false },
      { size: "G", exists: false, available: false },
    ]);
  });

  it("preserves a compatible size and replaces an invalid size when switching color", () => {
    expect(selectVariantForColor(variants, "Preto", "G")?.size).toBe("G");
    expect(selectVariantForColor(variants, "Preto", "P")?.size).toBe("M");
    expect(selectVariantForColor(variants, "Bordô", "M")?.size).toBe("P");
    expect(selectVariantForColor(variants, "Inexistente")).toBeNull();
  });

  it("never resolves an unavailable or foreign variant", () => {
    expect(findAvailableVariant(variants, variants[1].id)).toBeNull();
    expect(findAvailableVariant(variants, "cm123456789012345678901239")).toBeNull();
    expect(findAvailableVariant([], variants[0].id)).toBeNull();
  });

  it("carries validated identifiers to the fitting page", () => {
    expect(createFittingPath(productId, variants[0].id)).toBe(`/provador?productId=${productId}&variantId=${variants[0].id}`);
    expect(productSelectionSchema.safeParse({ productId, variantId: "../../admin" }).success).toBe(false);
    expect(() => createFittingPath("invalid", variants[0].id)).toThrow();
  });
});

describe("validated product interest", () => {
  const input = {
    number: "5511999999999",
    product: { id: productId, name: "Demonstração & teste", slug: "produto-teste", url: "https://example.com/produto/produto-teste" },
    variant: { id: variants[0].id, color: "Bordô", size: "P", available: true as const },
  };

  it("encodes the product reference and exact variant in the message", () => {
    const url = new URL(createProductInterestLink(input));
    expect(url.origin).toBe("https://wa.me");
    const message = url.searchParams.get("text");
    for (const value of [input.product.name, input.product.slug, input.variant.id, "cor: Bordô", "tamanho: P", input.product.url]) expect(message).toContain(value);
  });

  it("rejects malformed identifiers, empty options and unsafe destinations", () => {
    expect(() => createProductInterestLink({ ...input, number: "123" })).toThrow();
    expect(() => createProductInterestLink({ ...input, variant: { ...input.variant, color: "" } })).toThrow();
    expect(() => createProductInterestLink({ ...input, product: { ...input.product, url: "javascript:alert(1)" } })).toThrow();
  });
});
