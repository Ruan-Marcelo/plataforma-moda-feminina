import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { ObjectStorage, StoredObject } from "./object-storage";

const localKeySchema = z.tuple([
  z.literal("products"),
  z.string().cuid(),
  z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/),
]);

const contentTypes = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export function localCatalogImageRoot() {
  return path.join(process.cwd(), ".local-data", "catalog-images");
}

function resolveImage(root: string, key: string) {
  const parts = localKeySchema.parse(key.split("/"));
  const extension = parts[2].split(".").at(-1) as keyof typeof contentTypes;
  return { filePath: path.join(path.resolve(root), ...parts), contentType: contentTypes[extension] };
}

/** Filesystem adapter for local development; the factory enforces this boundary. */
export class LocalObjectStorage implements ObjectStorage {
  constructor(private readonly root: string) {}

  async put(input: { key: string; body: Uint8Array; contentType: string }): Promise<StoredObject> {
    const image = resolveImage(this.root, input.key);
    if (image.contentType !== input.contentType) throw new Error("Image content type does not match its key");
    await mkdir(path.dirname(image.filePath), { recursive: true });
    await writeFile(image.filePath, input.body, { flag: "wx" });
    return { key: input.key, url: `/api/local-images/${input.key}` };
  }

  async read(key: string) {
    const image = resolveImage(this.root, key);
    return { body: new Uint8Array(await readFile(image.filePath)), contentType: image.contentType };
  }

  async delete(key: string) {
    const image = resolveImage(this.root, key);
    try { await unlink(image.filePath); }
    catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
}
