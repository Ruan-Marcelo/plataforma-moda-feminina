import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fittingConsentVersion } from "@/features/virtual-fitting/contracts";
import { VirtualTryOnProviderError, VirtualTryOnTimeoutError } from "@/features/virtual-fitting/types";

const { generate, findProduct, limit, garment, reserve, submitted, finish } = vi.hoisted(() => ({ generate: vi.fn(), findProduct: vi.fn(), limit: vi.fn(), garment: vi.fn(), reserve: vi.fn(), submitted: vi.fn(), finish: vi.fn() }));
vi.mock("@/features/products/repository", () => ({ findPublishedProductById: findProduct }));
vi.mock("@/features/virtual-fitting/garment-image", () => ({ readGarmentImage: garment }));
vi.mock("@/lib/env", () => ({ env: { DATABASE_URL: "test-only", AUTH_SECRET: "test-only-secret-with-at-least-32-characters", NODE_ENV: "test", NEXT_PUBLIC_APP_URL: "http://localhost", FASHN_API_KEY: "test-only-not-a-real-key", VIRTUAL_FITTING_ENABLED: true, FASHN_SPENDING_APPROVED: true, FASHN_DAILY_CREDIT_LIMIT: 10, FASHN_OWNER_DAILY_LIMIT: 3, FASHN_MAX_CONCURRENT: 2 } }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRateLimit: limit }));
vi.mock("@/features/virtual-fitting/fashn-provider", () => ({ FashnVirtualTryOnProvider: class { generate = generate; } }));
vi.mock("@/features/virtual-fitting/operation-repository", async importOriginal => ({ ...(await importOriginal<typeof import("@/features/virtual-fitting/operation-repository")>()), reserveFittingOperation: reserve, markFittingSubmitted: submitted, finishFittingOperation: finish }));

import { POST } from "@/app/api/virtual-fitting/route";
import { env } from "@/lib/env";
import { FittingLimitError } from "@/features/virtual-fitting/operation-repository";

const productId = "cm123456789012345678901234";
const variantId = "cm123456789012345678901235";
const operationId = "cm123456789012345678901236";
const fixture = readFileSync("public/brand/belin-logo.jpeg");
const privateResult = `data:image/jpeg;base64,${fixture.toString("base64")}`;

function request(changes: Record<string, string> = {}, signal?: AbortSignal, headers: Record<string, string> = {}) {
  const body = new FormData();
  const fields = { productId, variantId, requestId: crypto.randomUUID(), consent: "true", consentVersion: fittingConsentVersion, ...changes };
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  body.set("image", new File([fixture], "fixture.jpg", { type: "image/jpeg" }));
  return new Request("http://localhost/api/virtual-fitting", { method: "POST", body, signal, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  env.FASHN_API_KEY = "test-only-not-a-real-key"; env.VIRTUAL_FITTING_ENABLED = true; env.FASHN_SPENDING_APPROVED = true; env.FASHN_DAILY_CREDIT_LIMIT = 10;
  findProduct.mockResolvedValue({ id: productId, images: [{ storageKey: `products/${productId}/${crypto.randomUUID()}.jpg` }], variants: [{ id: variantId, color: "Bordô", size: "P", available: true }] });
  limit.mockReset().mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
  garment.mockResolvedValue({ bytes: new Uint8Array(fixture), mimeType: "image/jpeg" });
  reserve.mockReset().mockResolvedValue({ id: operationId }); submitted.mockResolvedValue(undefined); finish.mockResolvedValue(undefined);
  generate.mockReset().mockResolvedValue({ resultUrl: privateResult, providerRequestId: "provider-private-id", creditsUsed: 2 });
});
afterEach(() => vi.restoreAllMocks());

describe("paid fitting boundaries (no external network; provider is mocked)", () => {
  it("does not allow a key alone to authorize spending", async () => {
    env.FASHN_API_KEY = undefined;
    expect((await POST(request())).status).toBe(503);
    env.FASHN_API_KEY = "test-only-not-a-real-key"; env.FASHN_SPENDING_APPROVED = false;
    expect((await POST(request())).status).toBe(503);
    env.FASHN_SPENDING_APPROVED = true; env.FASHN_DAILY_CREDIT_LIMIT = 0;
    expect((await POST(request())).status).toBe(503);
    expect(generate).not.toHaveBeenCalled(); expect(reserve).not.toHaveBeenCalled();
  });

  it("validates consent, identifiers, origin and actual image contents on the server", async () => {
    const cases: Array<Record<string, string>> = [{ consent: "false" }, { consentVersion: "old" }, { variantId: "invalid" }];
    for (const fields of cases) expect((await POST(request(fields))).status).toBe(400);
    expect((await POST(request({}, undefined, { origin: "https://attacker.example" }))).status).toBe(403);
    expect((await POST(new Request("http://localhost/api/virtual-fitting", { method: "POST", body: "not multipart", headers: { "content-type": "text/plain" } }))).status).toBe(400);
    expect((await POST(request({}, undefined, { "content-length": String(10 * 1024 * 1024) }))).status).toBe(413);
    const body = new FormData();
    for (const [key, value] of Object.entries({ productId, variantId, requestId: crypto.randomUUID(), consent: "true", consentVersion: fittingConsentVersion })) body.set(key, value);
    body.set("image", new File([new Uint8Array([255, 216, 255])], "truncated.jpg", { type: "image/jpeg" }));
    expect((await POST(new Request("http://localhost/api/virtual-fitting", { method: "POST", body }))).status).toBe(400);
    expect(generate).not.toHaveBeenCalled();
    expect(garment).not.toHaveBeenCalled();
  });

  it("revalidates the variant and requires access to the owned garment image", async () => {
    findProduct.mockResolvedValueOnce({ id: productId, images: [], variants: [] });
    expect((await POST(request())).status).toBe(409);
    garment.mockRejectedValueOnce(new Error("not stored here"));
    expect((await POST(request())).status).toBe(422);
    expect(generate).not.toHaveBeenCalled();
  });

  it("returns a private image only in the initiating response, with no prediction ID or CDN URL", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("private, no-store");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    const data = await response.json();
    expect(data).toEqual({ resultUrl: privateResult, operationId });
    expect(data).not.toHaveProperty("providerRequestId");
    expect(generate.mock.calls[0][0]).toMatchObject({ productId, variantId });
    expect(finish).toHaveBeenCalledWith(operationId, expect.objectContaining({ settled: true, actualCredits: 2 }));
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("data:image");
  });

  it("uses separate owner bindings for separate clients; never looks up a shared result", async () => {
    const first = await POST(request());
    const second = await POST(request());
    expect(first.headers.get("set-cookie")).not.toBe(second.headers.get("set-cookie"));
    expect(reserve.mock.calls[0][0].ownerHash).not.toBe(reserve.mock.calls[1][0].ownerHash);
  });

  it("never calls the provider when a persisted quota or duplicate guard refuses reservation", async () => {
    for (const code of ["budget_exhausted", "usage_limit", "concurrency_limit", "duplicate_request"] as const) {
      reserve.mockRejectedValueOnce(new FittingLimitError(code));
      const response = await POST(request());
      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({ error: code });
    }
    expect(generate).not.toHaveBeenCalled();
  });

  it("handles timeout, ambiguous submission and untrusted output without refunding uncertain work", async () => {
    generate.mockRejectedValueOnce(new VirtualTryOnTimeoutError("provider-id"));
    expect((await POST(request())).status).toBe(504);
    expect(finish).toHaveBeenLastCalledWith(operationId, expect.objectContaining({ settled: false, status: "TIMED_OUT" }));
    generate.mockRejectedValueOnce(new VirtualTryOnProviderError("submission_unknown"));
    expect(await (await POST(request())).json()).toMatchObject({ error: "submission_unknown" });
    generate.mockResolvedValueOnce({ resultUrl: "https://cdn.fashn.ai/shared.jpg", providerRequestId: "provider-id" });
    expect((await POST(request())).status).toBe(503);
  });

  it("does not call a provider for an already cancelled request", async () => {
    const controller = new AbortController(); controller.abort();
    expect((await POST(request({}, controller.signal))).status).toBe(499);
    expect(generate).not.toHaveBeenCalled();
  });
});
