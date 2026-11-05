// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it } from "vitest";
import { catalogQuerySchema } from "@/features/products/validation";

describe("catalogQuerySchema", () => {
  it("preserva busca e filtros ao enviar Todas e campos opcionais vazios", () => {
    const query = catalogQuerySchema.parse({
      q: "vestido", categoryId: "", collectionId: " ",
      size: "M", color: "Bordô", availability: "available",
      sort: "price_desc", minPrice: "", maxPrice: "",
    });
    expect(query).toMatchObject({ q: "vestido", size: "M", color: "Bordô", availability: "available", sort: "price_desc" });
    expect(query.categoryId).toBeUndefined();
    expect(query.collectionId).toBeUndefined();
    expect(query.minPrice).toBeUndefined();
    expect(query.maxPrice).toBeUndefined();
  });

  it("continua rejeitando identificadores não vazios inválidos", () => {
    expect(catalogQuerySchema.safeParse({ categoryId: "invalido" }).success).toBe(false);
  });

  it("normaliza pagina e tamanho da pagina", () => {
    expect(catalogQuerySchema.parse({ page: "2", pageSize: "12" })).toMatchObject({ page: 2, pageSize: 12, sort: "newest" });
  });

  it("rejeita intervalo de preco invertido", () => {
    expect(() => catalogQuerySchema.parse({ minPrice: "2000", maxPrice: "1000" })).toThrow();
  });

  it("preserva filtros combinados de categoria, disponibilidade e ordenação", () => {
    expect(catalogQuerySchema.parse({ categoryId: "cmf4x8x8x0000abc123456789", availability: "available", sort: "price_desc" })).toMatchObject({
      availability: "available",
      sort: "price_desc",
    });
  });
});
