import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { FashnVirtualTryOnProvider } from "@/features/virtual-fitting/fashn-provider";

const bytes = new Uint8Array(readFileSync("public/brand/belin-logo.jpeg"));
const privateImage = `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`;
const input = { productId: "cm123456789012345678901234", variantId: "cm123456789012345678901235", image: { bytes, mimeType: "image/jpeg" as const }, garmentImage: { bytes, mimeType: "image/jpeg" as const } };
const completed = () => Response.json({ status: "completed", output: [privateImage] }, { headers: { "x-fashn-credits-used": "2" } });

describe("real FASHN adapter protocol (HTTP mocked, no paid requests)", () => {
  it("submits both images as base64 with the explicit billed profile and polls the returned ID", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ id: "prediction_1" })).mockResolvedValueOnce(Response.json({ status: "processing" })).mockResolvedValueOnce(completed());
    const onSubmitted = vi.fn(async () => undefined);
    const provider = new FashnVirtualTryOnProvider({ apiKey: "unit-test-only", fetcher, pause: async () => undefined });
    const result = await provider.generate({ ...input, onSubmitted });
    const payload = JSON.parse(fetcher.mock.calls[0][1]!.body as string);
    expect(payload.inputs).toMatchObject({ num_images: 1, resolution: "1k", generation_mode: "balanced", output_format: "jpeg", return_base64: true });
    expect(payload.inputs).not.toHaveProperty("num_samples");
    expect(payload.inputs.product_image).toMatch(/^data:image\/jpeg;base64,/);
    expect(payload.inputs.model_image).toMatch(/^data:image\/jpeg;base64,/);
    expect(onSubmitted).toHaveBeenCalledWith("prediction_1");
    expect(fetcher.mock.calls[1][0]).toBe("https://api.fashn.ai/v1/status/prediction_1");
    expect(result.resultUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(result.creditsUsed).toBe(2);
    expect(fetcher.mock.calls.filter(call => call[1]?.method === "POST")).toHaveLength(1);
  });

  it("retries a transient status request but never repeats the billable POST", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ id: "prediction_retry" })).mockResolvedValueOnce(Response.json({ error: "InternalServerError" }, { status: 500 })).mockResolvedValueOnce(completed());
    const pause = vi.fn(async () => undefined);
    await new FashnVirtualTryOnProvider({ apiKey: "unit-test-only", fetcher, pause }).generate(input);
    expect(fetcher.mock.calls.map(call => call[1]?.method)).toEqual(["POST", "GET", "GET"]);
    expect(pause).toHaveBeenCalled();
  });

  it("does not replay an ambiguous creation failure or expose its raw message", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("network details must not be returned"));
    await expect(new FashnVirtualTryOnProvider({ apiKey: "unit-test-only", fetcher }).generate(input)).rejects.toMatchObject({ code: "submission_unknown", message: "submission_unknown" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("handles authentication, credits, unavailable service and malformed results", async () => {
    for (const [status, error, code] of [[401, "UnauthorizedAccess", "authentication"], [429, "OutOfCredits", "credits"]] as const) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error }, { status }));
      await expect(new FashnVirtualTryOnProvider({ apiKey: "unit-test-only", fetcher }).generate(input)).rejects.toMatchObject({ code, settled: true });
      expect(fetcher).toHaveBeenCalledOnce();
    }
    const unavailable = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ id: "prediction_fail" })).mockImplementation(async () => Response.json({ error: "InternalServerError" }, { status: 500 }));
    await expect(new FashnVirtualTryOnProvider({ apiKey: "unit-test-only", fetcher: unavailable, pause: async () => undefined }).generate(input)).rejects.toMatchObject({ code: "failed" });
    expect(unavailable).toHaveBeenCalledTimes(4);
    const shared = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ id: "prediction_private" })).mockResolvedValueOnce(Response.json({ status: "completed", output: ["https://cdn.fashn.ai/shared.jpg"] }));
    await expect(new FashnVirtualTryOnProvider({ apiKey: "unit-test-only", fetcher: shared, pause: async () => undefined }).generate(input)).rejects.toMatchObject({ code: "invalid_response", settled: true });
  });

  it("enforces a deadline and propagates cancellation to an in-flight network call", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, options) => new Promise((_resolve, reject) => options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })));
    await expect(new FashnVirtualTryOnProvider({ apiKey: "unit-test-only", fetcher, timeoutMs: 10 }).generate(input)).rejects.toMatchObject({ name: "VirtualTryOnTimeoutError" });
    expect(fetcher).toHaveBeenCalledOnce();
    const controller = new AbortController();
    const request = new FashnVirtualTryOnProvider({ apiKey: "unit-test-only", fetcher }).generate(input, controller.signal);
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });
});
