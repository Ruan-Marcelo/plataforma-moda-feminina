import { beforeEach, describe, expect, it, vi } from "vitest";
const { findProduct, config } = vi.hoisted(() => ({ findProduct: vi.fn(), config: { whatsappNumber: "5511999999999" as string | undefined, appUrl: "https://example.com" } }));
vi.mock("@/config/store", () => ({ storeConfig: config }));
vi.mock("@/features/products/repository", () => ({ findPublishedProductById: findProduct }));
import { GET } from "@/app/api/products/[id]/interest/route";
const id = "cm123456789012345678901234", variantId = "cm123456789012345678901235";
function get(query = "") { return GET(new Request(`https://example.com/api/products/${id}/interest${query}`), { params: Promise.resolve({ id }) }); }
beforeEach(() => { config.whatsappNumber = "5511999999999"; findProduct.mockReset().mockResolvedValue({ id, name: "Peça & edição especial", slug: "peca-real", variants: [{ id: variantId, size: "P", color: "Bordô", available: true }] }); });
describe("server-validated contact", () => {
  it("includes only the piece when no variant was selected", async () => {
    const response = await get();
    expect(response.status).toBe(303);
    const url = new URL(response.headers.get("location")!);
    expect(url.origin).toBe("https://wa.me");
    expect(url.searchParams.get("text")).toContain("Peça & edição especial, referência peca-real");
    expect(url.searchParams.get("text")).not.toContain("tamanho:");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("revalidates selected color and size and excludes personal image parameters", async () => {
    const response = await get(`?variantId=${variantId}&image=data:private-photo&resultUrl=https://private.example`);
    const text = new URL(response.headers.get("location")!).searchParams.get("text")!;
    expect(text).toContain("tamanho: P, cor: Bordô");
    expect(text).not.toContain("private");
    expect(text).not.toContain("data:");
  });
  it("refuses malformed and duplicate variants and redirects stale variants to details", async () => {
    expect((await get("?variantId=bad")).status).toBe(400);
    expect((await get(`?variantId=${variantId}&variantId=${variantId}`)).status).toBe(400);
    expect((await get("?variantId=cm123456789012345678901239")).headers.get("location")).toContain("selection=unavailable");
  });
  it("does not invent a contact, reveal unpublished products or fail with a database exception", async () => {
    config.whatsappNumber = undefined;
    expect((await get()).status).toBe(503);
    findProduct.mockResolvedValueOnce(null);
    expect((await get()).status).toBe(404);
    findProduct.mockRejectedValueOnce(new Error("private database error"));
    expect(await (await get()).json()).toEqual({ error: "selection_unavailable" });
  });
});
