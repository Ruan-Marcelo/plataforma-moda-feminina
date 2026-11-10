import { beforeEach, describe, expect, it, vi } from "vitest";
const { create, limit } = vi.hoisted(() => ({ create: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { analyticsEvent: { create } } }));
vi.mock("@/lib/env", () => ({ env: { DATABASE_URL: "test-only" } }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRateLimit: limit }));
import { POST } from "@/app/api/analytics/route";
const event = { name: "page_view", anonymousId: "test-only-anonymous-id", analyticsConsent: true };
function request(value: unknown) { return new Request("http://localhost", { method: "POST", body: JSON.stringify(value) }); }
beforeEach(() => { vi.clearAllMocks(); create.mockResolvedValue({}); limit.mockReturnValue({ allowed: true }); });
describe("analytics input and bounded admission", () => {
  it("retains explicit consent and does not persist oversized or invalid bodies", async () => {
    expect((await POST(request({ ...event, analyticsConsent: false }))).status).toBe(400);
    expect((await POST(request("x".repeat(32001)))).status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });
  it("preserves the existing 60/minute quota through the bounded shared limiter", async () => {
    expect((await POST(request(event))).status).toBe(204);
    expect(limit).toHaveBeenCalledWith(`analytics:${event.anonymousId}`, 60, 60000);
    limit.mockReturnValueOnce({ allowed: false });
    expect((await POST(request(event))).status).toBe(429);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
