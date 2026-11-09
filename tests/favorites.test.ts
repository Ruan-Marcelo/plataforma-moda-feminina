import { describe, expect, it } from "vitest";
import { favoriteIdsSchema, parseFavorites, serializeFavorites } from "@/features/favorites/contracts";
import { toFavoriteProduct } from "@/features/favorites/service";
const id = "cm123456789012345678901234";
describe("minimal local favorites", () => {
  it("roundtrips IDs without duplicates or personal/product data", () => {
    const stored = serializeFavorites([id, id]);
    expect(parseFavorites(stored)).toEqual([id]);
    expect(JSON.parse(stored)).toEqual({ version: 1, ids: [id] });
  });
  it("recovers from invalid, oversized, stale-version and malformed storage", () => {
    for (const value of [null, "bad json", "x".repeat(10001), JSON.stringify({ version: 2, ids: [id] }), JSON.stringify({ version: 1, ids: ["../../admin"] })]) expect(parseFavorites(value)).toEqual([]);
    expect(favoriteIdsSchema.safeParse(Array(101).fill(id)).success).toBe(false);
  });
  it("serializes only public card fields and hides prices on the server", () => {
    const product = { id, name: "Peça", slug: "peca", priceCents: 19900, images: [], variants: [{ available: false }], privateNote: "private" };
    const result = toFavoriteProduct(product, false);
    expect(result.priceCents).toBeNull();
    expect(result.available).toBe(false);
    expect(result.availabilityKnown).toBe(true);
    expect(result).not.toHaveProperty("privateNote");
  });
});
