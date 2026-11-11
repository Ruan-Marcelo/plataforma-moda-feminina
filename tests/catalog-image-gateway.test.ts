import { beforeEach, describe, expect, it, vi } from "vitest";

const { findImage, session, read } = vi.hoisted(() => ({ findImage: vi.fn(), session: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { productImage: { findFirst: findImage } } }));
vi.mock("@/../auth", () => ({ auth: session }));
vi.mock("@/lib/storage/object-storage", () => ({ getObjectStorage: () => ({ read }) }));
import { GET } from "@/app/api/catalog-images/[...key]/route";
import { catalogImageUrl } from "@/lib/storage/catalog-image-url";

const product = "cm123456789012345678901234";
const key = `products/${product}/8f5cb458-1d32-4aa8-94d1-52989b8174f0.jpg`;
const params = { params: Promise.resolve({ key: key.split("/") }) };
beforeEach(() => { vi.resetAllMocks(); read.mockResolvedValue({ body: new Uint8Array([1]), contentType: "image/jpeg" }); });
describe("authorized catalog image gateway", () => {
  it("hides draft images from anonymous users and customers before accessing storage", async () => {
    findImage.mockResolvedValue({ product: { status: "DRAFT" } });
    for (const actor of [null, { user: { role: "CLIENTE" } }]) {
      session.mockResolvedValueOnce(actor);
      expect((await GET(new Request("http://localhost"), params)).status).toBe(404);
    }
    expect(read).not.toHaveBeenCalled();
    session.mockResolvedValueOnce({ user: { role: "EDITOR" } });
    const response = await GET(new Request("http://localhost"), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("serves only referenced published images and rejects malformed keys", async () => {
    findImage.mockResolvedValueOnce({ product: { status: "PUBLISHED" } });
    expect((await GET(new Request("http://localhost"), params)).status).toBe(200);
    expect(session).not.toHaveBeenCalled();
    findImage.mockResolvedValueOnce(null);
    expect((await GET(new Request("http://localhost"), params)).status).toBe(404);
    expect((await GET(new Request("http://localhost"), { params: Promise.resolve({ key: ["..", "secret"] }) })).status).toBe(404);
    expect(read).toHaveBeenCalledTimes(1);
  });
  it("keeps external legacy paths only for images without an owned key", () => {
    expect(catalogImageUrl({ storageKey: key, url: "https://example.test/private.jpg" })).toBe(`/api/catalog-images/${key}`);
    expect(catalogImageUrl({ storageKey: null, url: "/demo/example.svg" })).toBe("/demo/example.svg");
  });
});
