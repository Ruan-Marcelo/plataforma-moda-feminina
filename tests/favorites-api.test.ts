import { beforeEach, describe, expect, it, vi } from "vitest";
const { findProducts, config } = vi.hoisted(() => ({ findProducts: vi.fn(), config: { showPrices: false } }));
vi.mock("@/config/store", () => ({ storeConfig: config }));
vi.mock("@/features/products/repository", () => ({ findPublishedProductsByIds: findProducts }));
import { POST } from "@/app/api/favorites/route";
const id = "cm123456789012345678901234", missing = "cm123456789012345678901235";
function request(value: unknown) { return new Request("https://example.com/api/favorites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }); }
beforeEach(() => { config.showPrices = false; findProducts.mockReset().mockResolvedValue([{ id, name: "Peça", slug: "peca", priceCents: 19900, images: [], variants: [{ available: false }] }]); });
describe("favorites public catalog lookup", () => {
  it("deduplicates and preserves requested order while distinguishing missing pieces", async () => {
    const response = await POST(request([missing, id, id]));
    const data = await response.json();
    expect(findProducts).toHaveBeenCalledWith([missing, id]);
    expect(data.missingIds).toEqual([missing]);
    expect(data.products).toHaveLength(1);
    expect(data.products[0]).toMatchObject({ id, priceCents: null, available: false });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("rejects malformed/oversized IDs before touching persistence", async () => {
    for (const body of [["invalid"], Array(101).fill(id), { ids: [id] }, "x".repeat(11000)]) expect((await POST(request(body))).status).toBe(400);
    expect(findProducts).not.toHaveBeenCalled();
  });
  it("preserves local state by returning a distinct error during catalog outages", async () => {
    findProducts.mockRejectedValueOnce(new Error("secret connection detail"));
    const response = await POST(request([id]));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "catalog_unavailable" });
  });
});
