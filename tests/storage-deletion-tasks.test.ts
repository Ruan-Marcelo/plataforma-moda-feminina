import { beforeEach, describe, expect, it, vi } from "vitest";
const { findMany, updateMany, count, remove } = vi.hoisted(() => ({ findMany: vi.fn(), updateMany: vi.fn(), count: vi.fn(), remove: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: { STORAGE_DRIVER: "local" } }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { storageDeletionTask: { findMany, updateMany }, productImage: { count } } }));
vi.mock("@/lib/storage/object-storage", () => ({ getObjectStorage: () => ({ delete: remove }) }));
import { processStorageDeletions } from "@/lib/storage/deletion-tasks";
const key = "products/cm123456789012345678901234/8f5cb458-1d32-4aa8-94d1-52989b8174f0.jpg";
beforeEach(() => { vi.resetAllMocks(); findMany.mockResolvedValue([{ id: "task", storageKey: key, attempts: 0 }]); updateMany.mockResolvedValue({ count: 1 }); count.mockResolvedValue(0); remove.mockResolvedValue(undefined); });
describe("durable object cleanup", () => {
  it("claims a task before deletion and records completion", async () => {
    expect(await processStorageDeletions()).toEqual({ examined: 1, completed: 1, failed: 0 });
    expect(remove).toHaveBeenCalledWith(key);
    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany.mock.calls[1][0].data.completedAt).toBeInstanceOf(Date);
  });
  it("never deletes a referenced image or a task already claimed elsewhere", async () => {
    count.mockResolvedValueOnce(1);
    await processStorageDeletions();
    expect(remove).not.toHaveBeenCalled();
    updateMany.mockResolvedValueOnce({ count: 0 });
    await processStorageDeletions();
    expect(remove).not.toHaveBeenCalled();
  });
  it("keeps failed storage operations for retry without storing the provider error", async () => {
    remove.mockRejectedValueOnce(new Error("sensitive details"));
    expect(await processStorageDeletions()).toMatchObject({ failed: 1 });
    expect(updateMany.mock.calls[1][0].data.errorCode).toBe("storage_cleanup_failed");
    expect(updateMany.mock.calls[1][0].data.nextAttemptAt).toBeInstanceOf(Date);
  });
  it("rejects invalid keys before accessing storage", async () => {
    findMany.mockResolvedValueOnce([{ id: "task", storageKey: "../../secret", attempts: 0 }]);
    expect(await processStorageDeletions()).toMatchObject({ failed: 1 });
    expect(remove).not.toHaveBeenCalled();
  });
});
