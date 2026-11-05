// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it } from "vitest";
import { productInputSchema } from "@/features/products/validation";

describe("productInputSchema", () => {
  it("aceita produto em rascunho com variação", () => {
    const result = productInputSchema.parse({ name: "Vestido Aurora", slug: "vestido-aurora", variants: [{ size: "M", color: "Preto" }] });
    expect(result.status).toBe("DRAFT");
    expect(result.variants[0]?.available).toBe(true);
  });

  it("rejeita slug com caminho ou caracteres inseguros", () => {
    expect(() => productInputSchema.parse({ name: "Produto", slug: "../admin" })).toThrow();
  });
});
