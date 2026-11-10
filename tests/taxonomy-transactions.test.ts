import { beforeEach, describe, expect, it, vi } from "vitest";
const { create, remove, audit, transaction } = vi.hoisted(() => ({ create: vi.fn(), remove: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
const id = "cm123456789012345678901234";
vi.mock("@/../auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "cm123456789012345678901234", role: "ADMIN" } }) }));
vi.mock("@/lib/db/prisma", () => {
  const tx = { category: { create, delete: remove }, collection: { create, delete: remove }, auditLog: { create: audit } };
  transaction.mockImplementation(async callback => callback(tx));
  return { prisma: { $transaction: transaction } };
});
import { POST } from "@/app/api/admin/taxonomy/route";
import { DELETE } from "@/app/api/admin/taxonomy/[kind]/[id]/route";
beforeEach(() => { vi.clearAllMocks(); create.mockResolvedValue({ id }); remove.mockResolvedValue({ id }); audit.mockResolvedValue({}); });
describe("taxonomy metadata and audit share a transaction", () => {
  it("creates and removes through the transaction client only", async () => {
    expect((await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ kind: "category", name: "Teste", slug: "teste" }) }))).status).toBe(201);
    expect((await DELETE(new Request("http://localhost"), { params: Promise.resolve({ kind: "category", id }) })).status).toBe(200);
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(audit).toHaveBeenCalledTimes(2);
  });
  it("does not report a successful write when audit fails", async () => {
    audit.mockRejectedValueOnce(new Error("database error"));
    expect((await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ kind: "collection", name: "Teste", slug: "teste" }) }))).status).toBe(503);
  });
});
