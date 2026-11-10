import { beforeEach, describe, expect, it, vi } from "vitest";
const { txCreate, txUpdate, txDelete, log, rootCreate, rootUpdate, rootDelete, transaction } = vi.hoisted(() => ({ txCreate: vi.fn(), txUpdate: vi.fn(), txDelete: vi.fn(), log: vi.fn(), rootCreate: vi.fn(), rootUpdate: vi.fn(), rootDelete: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db/prisma", () => {
  const tx = { product: { create: txCreate, update: txUpdate, delete: txDelete }, auditLog: { create: log } };
  transaction.mockImplementation(async callback => callback(tx));
  return { prisma: { product: { create: rootCreate, update: rootUpdate, delete: rootDelete }, auditLog: { create: vi.fn() }, $transaction: transaction } };
});
import { createProductForStaff, updateProductForStaff, deleteProductForStaff } from "@/features/products/admin-service";
const id = "cm123456789012345678901234";
const actor = { id, role: "ADMIN" as const };
const input = { name: "Peça de teste", slug: "teste", status: "DRAFT" as const, variants: [] };
beforeEach(() => { vi.clearAllMocks(); txCreate.mockResolvedValue({ id }); txUpdate.mockResolvedValue({ id }); txDelete.mockResolvedValue({ id }); log.mockResolvedValue({ id }); });
describe("catalog writes and audit use the same transaction", () => {
  it("creates, updates and deletes only through the transaction client", async () => {
    for (const operation of [() => createProductForStaff(actor, input), () => updateProductForStaff(actor, id, input), () => deleteProductForStaff(actor, id, true)]) await expect(operation()).resolves.toEqual({ id });
    expect(transaction).toHaveBeenCalledTimes(3);
    expect(log).toHaveBeenCalledTimes(3);
    expect(rootCreate).not.toHaveBeenCalled(); expect(rootUpdate).not.toHaveBeenCalled(); expect(rootDelete).not.toHaveBeenCalled();
  });
  it("does not report success if the audit write fails", async () => {
    log.mockRejectedValueOnce(new Error("audit failed"));
    await expect(createProductForStaff(actor, input)).rejects.toThrow("audit failed");
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(rootCreate).not.toHaveBeenCalled();
  });
  it("authorizes and checks destructive confirmation before starting a transaction", async () => {
    await expect(createProductForStaff(null, input)).rejects.toThrow();
    await expect(updateProductForStaff({ id, role: "CLIENTE" }, id, input)).rejects.toThrow();
    await expect(deleteProductForStaff(actor, id, false)).rejects.toThrow("Deletion confirmation");
    expect(transaction).not.toHaveBeenCalled();
  });
});
