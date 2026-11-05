// RUAN MARCELO RAMACIOTI LUZ
import { z } from "zod";
import { env } from "@/lib/env";
import { VirtualTryOnProviderError, VirtualTryOnTimeoutError, type VirtualTryOnProvider, type VirtualTryOnRequest, type VirtualTryOnResult } from "./types";

const runResponseSchema = z.object({ id: z.string().min(1) });
const statusResponseSchema = z.object({ status: z.enum(["starting", "in_queue", "processing", "completed", "failed"]), output: z.array(z.string().url()).optional() });
const providerOutputPrefix = "https://cdn.fashn.ai/";

function asDataUri(file: File, bytes: ArrayBuffer) { return `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`; }
function wait(milliseconds: number, signal?: AbortSignal) { return new Promise<void>((resolve, reject) => { const timer = setTimeout(resolve, milliseconds); signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Request aborted", "AbortError")); }, { once: true }); }); }

export class FashnVirtualTryOnProvider implements VirtualTryOnProvider {
  async generate(request: VirtualTryOnRequest, signal?: AbortSignal): Promise<VirtualTryOnResult> {
    if (!env.FASHN_API_KEY) throw new Error("FASHN provider is not configured");
    if (!/^https:\/\//.test(request.garmentImageUrl)) throw new Error("Product image URL is not safe for the provider");
    const modelImage = asDataUri(request.image, await request.image.arrayBuffer());
    const response = await fetch("https://api.fashn.ai/v1/run", { method: "POST", headers: { Authorization: `Bearer ${env.FASHN_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_name: env.FASHN_MODEL, inputs: { model_image: modelImage, product_image: request.garmentImageUrl, num_samples: 1 } }), signal });
    if (!response.ok) throw new VirtualTryOnProviderError();
    const run = runResponseSchema.safeParse(await response.json());
    if (!run.success) throw new VirtualTryOnProviderError();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await wait(3000, signal);
      const statusResponse = await fetch(`https://api.fashn.ai/v1/status/${encodeURIComponent(run.data.id)}`, { headers: { Authorization: `Bearer ${env.FASHN_API_KEY}` }, signal });
      if (!statusResponse.ok) throw new VirtualTryOnProviderError();
      const status = statusResponseSchema.safeParse(await statusResponse.json());
      if (!status.success) throw new VirtualTryOnProviderError();
      if (status.data.status === "failed") throw new VirtualTryOnProviderError();
      if (status.data.status === "completed") {
        const resultUrl = status.data.output?.[0];
        if (!resultUrl || !resultUrl.startsWith(providerOutputPrefix)) throw new VirtualTryOnProviderError();
        return { resultUrl, providerRequestId: run.data.id };
      }
    }
    throw new VirtualTryOnTimeoutError();
  }
}
