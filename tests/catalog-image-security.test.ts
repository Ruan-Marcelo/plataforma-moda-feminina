import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { session, image, product, put, read, create, audit } = vi.hoisted(() => ({ session: vi.fn(), image: vi.fn(), product: vi.fn(), put: vi.fn(), read: vi.fn(), create: vi.fn(), audit: vi.fn() }));
vi.mock("@/../auth", () => ({ auth: session }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { productImage: { findFirst: image, count: vi.fn().mockResolvedValue(0), create }, product: { findUnique: product }, auditLog: { create: audit } } }));
vi.mock("@/lib/env", () => ({ env: { NODE_ENV: "test", STORAGE_DRIVER: "local" } }));
vi.mock("@/lib/storage/local-object-storage", () => ({ localCatalogImageRoot: () => "test-only", LocalObjectStorage: class { read = read; } }));
vi.mock("@/lib/storage/object-storage", () => ({ getObjectStorage: () => ({ put, delete: vi.fn() }), createProductImageKey: (id: string) => `products/${id}/test.jpg`, ObjectStorageNotConfiguredError: class extends Error {} }));
import { GET } from "@/app/api/local-images/[...key]/route";
import { POST } from "@/app/api/admin/products/[id]/images/route";
const id = "cm123456789012345678901234";
const params = { params: Promise.resolve({ id }) };
const imageParams = { params: Promise.resolve({ key: ["products", id, "test.jpg"] }) };
beforeEach(() => { vi.clearAllMocks(); session.mockResolvedValue({ user: { id, role: "ADMIN" } }); image.mockResolvedValue({ product: { status: "DRAFT" } }); product.mockResolvedValue({ id }); read.mockResolvedValue({ body: new Uint8Array([1]), contentType: "image/jpeg" }); put.mockImplementation(async (input: { key: string }) => ({ key: input.key, url: `/api/local-images/${input.key}` })); create.mockResolvedValue({ id }); audit.mockResolvedValue({}); });
function request(bytes: Uint8Array, duplicate = false) { const form = new FormData(); form.set("alt", "Imagem autorizada de teste"); form.append("file", new File([new Uint8Array(bytes)], "image.jpg", { type: "image/jpeg" })); if (duplicate) form.append("file", new File([new Uint8Array(bytes)], "other.jpg", { type: "image/jpeg" })); return new Request("http://localhost/api/admin/products/image", { method: "POST", body: form }); }
describe("catalog image security", () => {
  it("does not expose drafts to anonymous users or customers, and permits editors", async () => {
    for (const actor of [null, { user: { id, role: "CUSTOMER" } }]) { session.mockResolvedValueOnce(actor); expect((await GET(new Request("http://localhost"), imageParams)).status).toBe(404); }
    expect(read).not.toHaveBeenCalled();
    expect((await GET(new Request("http://localhost"), imageParams)).status).toBe(200);
  });
  it("serves published catalog images without requiring login", async () => {
    image.mockResolvedValueOnce({ product: { status: "PUBLISHED" } });
    expect((await GET(new Request("http://localhost"), imageParams)).status).toBe(200);
    expect(session).not.toHaveBeenCalled();
  });
  it("authorizes uploads before reading files or persistence", async () => {
    session.mockResolvedValueOnce(null);
    expect((await POST(request(new Uint8Array([1])), params)).status).toBe(401);
    expect(product).not.toHaveBeenCalled(); expect(put).not.toHaveBeenCalled();
  });
  it("rejects truncated contents, duplicate files, malformed bodies and oversized streams", async () => {
    expect((await POST(request(new Uint8Array([255,216,255])), params)).status).toBe(400);
    expect((await POST(request(new Uint8Array([255,216,255]), true), params)).status).toBe(400);
    expect((await POST(new Request("http://localhost", { method: "POST", body: "not multipart" }), params)).status).toBe(400);
    const large = new Request("http://localhost", { method: "POST", body: "x", headers: { "content-length": String(10 * 1024 * 1024) } });
    expect((await POST(large, params)).status).toBe(413);
    expect(put).not.toHaveBeenCalled();
  });
  it("fully decodes and stores a normalized JPEG without inherited EXIF", async () => {
    const bytes = new Uint8Array(await readFile("public/brand/belin-logo.jpeg"));
    expect((await POST(request(bytes), params)).status).toBe(201);
    expect(put).toHaveBeenCalledWith(expect.objectContaining({ contentType: "image/jpeg" }));
    expect(create).toHaveBeenCalled();
  });
});
