import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createDatabaseClient } from "../src/lib/db/client";
vi.mock("server-only", () => ({}));
import { enqueueStorageDeletions, processStorageDeletions } from "@/lib/storage/deletion-tasks";

const databaseUrl = process.env.E2E_DATABASE_URL;
let db: PrismaClient;
const productIds: string[] = [];
const keys: string[] = [];
beforeAll(() => {
  if (!databaseUrl) return;
  const url = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^belin_product_e2e_[a-z0-9_]+$/.test(url.pathname.slice(1))) throw new Error("Use a dedicated local test database");
  db = createDatabaseClient(databaseUrl);
});
afterAll(async () => {
  if (!db) return;
  await db.storageDeletionTask.deleteMany({ where: { storageKey: { in: keys } } });
  await db.product.deleteMany({ where: { id: { in: productIds } } });
  await db.$disconnect();
});

describe.skipIf(!databaseUrl)("storage deletion transactions in isolated PostgreSQL", () => {
  it("rolls back a queued deletion with the catalog edit and completes it after a committed deletion", async () => {
    const product = await db.product.create({ data: { name: "Peça de teste", slug: `cleanup-${randomUUID()}`, status: "DRAFT" } });
    productIds.push(product.id);
    const key = `products/${product.id}/${randomUUID()}.jpg`;
    keys.push(key);
    const image = await db.productImage.create({ data: { productId: product.id, storageKey: key, url: "/test.jpg", alt: "Teste" } });
    await expect(db.$transaction(async tx => {
      await enqueueStorageDeletions(tx, [key]);
      await tx.productImage.delete({ where: { id: image.id } });
      throw new Error("simulated failure");
    })).rejects.toThrow("simulated failure");
    expect(await db.productImage.findUnique({ where: { id: image.id } })).not.toBeNull();
    expect(await db.storageDeletionTask.findUnique({ where: { storageKey: key } })).toBeNull();
    await db.$transaction(async tx => {
      await enqueueStorageDeletions(tx, [key]);
      await tx.productImage.delete({ where: { id: image.id } });
    });
    const remove = vi.fn().mockResolvedValue(undefined);
    const storage = { delete: remove, put: vi.fn(), read: vi.fn() };
    expect(await processStorageDeletions({ db, storage, keys: [key] })).toMatchObject({ completed: 1 });
    expect(remove).toHaveBeenCalledWith(key);
    expect((await db.storageDeletionTask.findUniqueOrThrow({ where: { storageKey: key } })).completedAt).toBeInstanceOf(Date);
  });
});
