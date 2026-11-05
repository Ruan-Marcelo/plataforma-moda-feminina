import { beforeEach, describe, expect, it, vi } from "vitest";
import { fittingConsentVersion } from "@/features/virtual-fitting/contracts";

const { generate, findProduct, limit } = vi.hoisted(() => ({ generate: vi.fn(), findProduct: vi.fn(), limit: vi.fn() }));
vi.mock("@/features/products/repository", () => ({ findPublishedProductById: findProduct }));
vi.mock("@/lib/env", () => ({ env: { DATABASE_URL: "test-only", FASHN_API_KEY: "test-only-not-a-real-key", VIRTUAL_FITTING_ENABLED: true } }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRateLimit: limit }));
vi.mock("@/features/virtual-fitting/fashn-provider", () => ({ FashnVirtualTryOnProvider: class { generate = generate; } }));

import { POST } from "@/app/api/virtual-fitting/route";
import { env } from "@/lib/env";

const productId = "cm123456789012345678901234";
const variantId = "cm123456789012345678901235";

function request(changes: Record<string, string> = {}, signal?: AbortSignal) {
  const body = new FormData();
  const fields = { productId, variantId, requestId: crypto.randomUUID(), consent: "true", consentVersion: fittingConsentVersion, ...changes };
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  body.set("image", new File([new Uint8Array([0xff, 0xd8, 0xff])], "fixture.jpg", { type: "image/jpeg" }));
  return new Request("http://localhost/api/virtual-fitting", { method: "POST", body, signal });
}

beforeEach(() => {
  vi.clearAllMocks();
  env.FASHN_API_KEY = "test-only-not-a-real-key"; env.VIRTUAL_FITTING_ENABLED = true;
  findProduct.mockResolvedValue({ id: productId, images: [{ url: "https://example.com/garment.jpg" }], variants: [{ id: variantId, color: "Bordô", colorHex: null, size: "P", available: true }] });
  limit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
  generate.mockResolvedValue({ resultUrl: "https://cdn.fashn.ai/test-only-result.jpg" });
});

describe("fitting API boundaries (provider mocked only inside tests)", () => {
  it("blocks unconfigured or disabled integration before reading a photo", async () => {
    env.FASHN_API_KEY = undefined;
    expect((await POST(request())).status).toBe(503);
    env.FASHN_API_KEY = "test-only-not-a-real-key"; env.VIRTUAL_FITTING_ENABLED = false;
    const response = await POST(request());
    expect(await response.json()).toEqual({ error: "not_enabled" });
    expect(generate).not.toHaveBeenCalled();
    expect(findProduct).not.toHaveBeenCalled();
  });

  it("rejects missing consent, outdated consent and malformed selection", async () => {
    const invalidCases: Array<Record<string, string>> = [{ consent: "false" }, { consentVersion: "old" }, { variantId: "invalid" }];
    for (const fields of invalidCases) expect((await POST(request(fields))).status).toBe(400);
    expect(generate).not.toHaveBeenCalled();
  });

  it("revalidates availability and refuses a local garment image", async () => {
    findProduct.mockResolvedValueOnce({ id: productId, images: [], variants: [] });
    expect((await POST(request())).status).toBe(409);
    findProduct.mockResolvedValueOnce({ id: productId, images: [{ url: "/demo/blusa-frente.svg" }], variants: [{ id: variantId, color: "Bordô", size: "P", available: true }] });
    expect((await POST(request())).status).toBe(422);
    expect(generate).not.toHaveBeenCalled();
  });

  it("only forwards a consented, current variant and never caches a result", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(generate).toHaveBeenCalledOnce();
    expect(generate.mock.calls[0][0]).toMatchObject({ productId, variantId });
  });

  it("rejects repeated request IDs and untrusted provider responses", async () => {
    limit.mockReturnValueOnce({ allowed: true, retryAfterSeconds: 0 }).mockReturnValueOnce({ allowed: false, retryAfterSeconds: 30 });
    expect((await POST(request())).status).toBe(409);
    expect(generate).not.toHaveBeenCalled();
    generate.mockResolvedValueOnce({ resultUrl: "https://attacker.example/photo.jpg" });
    expect((await POST(request())).status).toBe(502);
  });

  it("honors cancellation before provider work and treats a timeout as failure", async () => {
    const controller = new AbortController(); controller.abort();
    expect((await POST(request({}, controller.signal))).status).toBe(499);
    expect(generate).not.toHaveBeenCalled();
    generate.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    expect((await POST(request())).status).toBe(504);
  });
});
