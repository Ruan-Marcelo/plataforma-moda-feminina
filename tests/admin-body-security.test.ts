import { beforeEach, describe, expect, it, vi } from "vitest";
const { session, create, update, remove } = vi.hoisted(() => ({ session: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }));
vi.mock("@/../auth", () => ({ auth: session }));
vi.mock("@/features/products/admin-service", () => ({ canEditCatalog: (role: string) => ["ADMIN", "EDITOR"].includes(role), createProductForStaff: create, updateProductForStaff: update, deleteProductForStaff: remove }));
vi.mock("@/features/products/repository", () => ({ listAdminProducts: vi.fn() }));
import { POST } from "@/app/api/admin/products/route";
import { PUT, DELETE } from "@/app/api/admin/products/[id]/route";
import { maxAdminJsonBytes } from "@/lib/security/request-body";
const id = "cm123456789012345678901234", params = { params: Promise.resolve({ id }) };
beforeEach(() => { vi.clearAllMocks(); session.mockResolvedValue({ user: { id, role: "ADMIN" } }); });
describe("authorization precedes administrative JSON parsing", () => {
  it("rejects anonymous users and clients without touching the request body", async () => {
    for (const actor of [null, { user: { id, role: "CLIENTE" } }]) for (const handler of [POST, (r: Request) => PUT(r, params), (r: Request) => DELETE(r, params)]) {
      session.mockResolvedValueOnce(actor);
      const request = new Request("http://localhost", { method: "POST", body: "{}" });
      const body = vi.spyOn(request.body!, "getReader");
      expect((await handler(request)).status).toBe(actor ? 403 : 401);
      expect(body).not.toHaveBeenCalled();
    }
    expect(create).not.toHaveBeenCalled(); expect(update).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
  });
  it("refuses actual oversized bodies without trusting Content-Length", async () => {
    const request = new Request("http://localhost", { method: "POST", body: "x".repeat(maxAdminJsonBytes + 1) });
    expect((await POST(request)).status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });
});
