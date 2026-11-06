import { randomUUID } from "node:crypto";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalObjectStorage } from "@/lib/storage/local-object-storage";

const { storage } = vi.hoisted(() => ({ storage: { read: vi.fn() } }));
vi.mock("@/lib/storage/object-storage", () => ({ getObjectStorage: () => storage }));
import { readGarmentImage } from "@/features/virtual-fitting/garment-image";

const productId = "cm123456789012345678901234";
const directories: string[] = [];
afterEach(async () => {
  vi.clearAllMocks();
  for (const directory of directories.splice(0)) {
    const resolved = path.resolve(directory);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("belin-garment-")) throw new Error("Unsafe temporary directory");
    await rm(resolved, { recursive: true, force: true });
  }
});

describe("garment input from authorized storage", () => {
  it("loads and validates a real local catalog image without a public URL or HTTP fetch", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "belin-garment-")); directories.push(root);
    const local = new LocalObjectStorage(root);
    const key = `products/${productId}/${randomUUID()}.jpg`;
    await local.put({ key, body: await readFile("public/brand/belin-logo.jpeg"), contentType: "image/jpeg" });
    storage.read.mockImplementation((value: string) => local.read(value));
    const image = await readGarmentImage(productId, key);
    expect(image.mimeType).toBe("image/jpeg");
    expect(image.bytes.byteLength).toBeGreaterThan(16);
    expect(storage.read).toHaveBeenCalledOnce();
  });

  it("refuses foreign-product keys and arbitrary/private URLs before touching storage", async () => {
    for (const key of [undefined, "https://localhost/private.jpg", `products/cm999999999999999999999999/${randomUUID()}.jpg`, "../../.env"]) await expect(readGarmentImage(productId, key)).rejects.toThrow();
    expect(storage.read).not.toHaveBeenCalled();
  });

  it("does not trust a stored filename or MIME label if the contents are invalid", async () => {
    storage.read.mockResolvedValueOnce({ body: new Uint8Array([255, 216, 255]), contentType: "image/jpeg" });
    await expect(readGarmentImage(productId, `products/${productId}/${randomUUID()}.jpg`)).rejects.toThrow("invalid_image");
  });
});
