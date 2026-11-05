import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalObjectStorage } from "@/lib/storage/local-object-storage";

const temporaryRoots: string[] = [];
const key = "products/cm123456789012345678901234/12345678-1234-4123-8123-123456789012.png";

async function createStorage() {
  const root = await mkdtemp(path.join(os.tmpdir(), "belin-storage-"));
  temporaryRoots.push(root);
  return { storage: new LocalObjectStorage(root), root };
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map(root => {
    const resolved = path.resolve(root);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("belin-storage-")) {
      throw new Error("Unexpected temporary storage directory");
    }
    return rm(resolved, { recursive: true, force: true });
  }));
});

describe("local catalog image storage", () => {
  it("persists bytes across adapter instances and removes the image", async () => {
    const { storage, root } = await createStorage();
    const body = new Uint8Array([137, 80, 78, 71]);
    const stored = await storage.put({ key, body, contentType: "image/png" });
    expect(stored.url).toBe(`/api/local-images/${key}`);
    expect(await new LocalObjectStorage(root).read(key)).toEqual({ body, contentType: "image/png" });
    await storage.delete(key);
    await expect(readFile(path.join(root, key))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(storage.delete(key)).resolves.toBeUndefined();
  });

  it("rejects traversal, Windows paths, encoded paths, and non-image extensions", async () => {
    const { storage } = await createStorage();
    for (const invalid of ["../.env", "products/../../.env", "C:\\secret.png", key.replace("products/", "products/%2e%2e/"), key.replace(".png", ".html")]) {
      await expect(storage.put({ key: invalid, body: new Uint8Array([1]), contentType: "image/png" })).rejects.toThrow();
      await expect(storage.read(invalid)).rejects.toThrow();
      await expect(storage.delete(invalid)).rejects.toThrow();
    }
  });

  it("rejects a mismatched content type and never overwrites an existing image", async () => {
    const { storage } = await createStorage();
    await expect(storage.put({ key, body: new Uint8Array([1]), contentType: "text/html" })).rejects.toThrow();
    await storage.put({ key, body: new Uint8Array([1]), contentType: "image/png" });
    await expect(storage.put({ key, body: new Uint8Array([2]), contentType: "image/png" })).rejects.toMatchObject({ code: "EEXIST" });
    expect((await storage.read(key)).body).toEqual(new Uint8Array([1]));
  });
});
