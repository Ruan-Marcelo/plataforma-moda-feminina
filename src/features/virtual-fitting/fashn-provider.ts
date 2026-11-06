import { z } from "zod";
import { env } from "@/lib/env";
import { readBoundedStream } from "./bounded-body";
import { decodePrivateFittingImage } from "./contracts";
import { normalizeFittingImage } from "./server-image";
import { VirtualTryOnNotConfiguredError, VirtualTryOnProviderError, VirtualTryOnTimeoutError, type VirtualTryOnProvider, type VirtualTryOnRequest, type VirtualTryOnResult } from "./types";

const predictionSchema = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,160}$/) });
const statusSchema = z.object({ status: z.enum(["starting", "in_queue", "processing", "completed", "failed"]), output: z.array(z.string()).optional(), error: z.unknown().optional() });
class HttpError extends Error { constructor(public status: number, public nameCode: string, public retryAfterMs: number) { super("provider_http_error"); } }

function sleep(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Cancelled", "AbortError")); return; }
    const abort = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); reject(new DOMException("Cancelled", "AbortError")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}

type Options = { apiKey?: string; fetcher?: typeof fetch; pause?: typeof sleep; timeoutMs?: number; pollMs?: number };
export class FashnVirtualTryOnProvider implements VirtualTryOnProvider {
  constructor(private readonly options: Options = {}) {}

  async generate(input: VirtualTryOnRequest, externalSignal?: AbortSignal): Promise<VirtualTryOnResult> {
    const apiKey = this.options.apiKey ?? env.FASHN_API_KEY;
    if (!apiKey) throw new VirtualTryOnNotConfiguredError();
    const fetcher = this.options.fetcher ?? fetch;
    const pause = this.options.pause ?? sleep;
    const controller = new AbortController();
    const abort = () => controller.abort();
    externalSignal?.addEventListener("abort", abort, { once: true });
    const deadline = setTimeout(abort, this.options.timeoutMs ?? 70_000);
    let providerId: string | undefined;

    const readJson = async (method: "POST" | "GET", path: string, body?: unknown) => {
      const requestController = new AbortController();
      const stop = () => requestController.abort();
      controller.signal.addEventListener("abort", stop, { once: true });
      const timer = setTimeout(stop, 10_000);
      try {
        if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
        const response = await fetcher(`https://api.fashn.ai/v1/${path}`, { method, headers: { Authorization: `Bearer ${apiKey}`, ...(method === "POST" ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: requestController.signal, redirect: "error", cache: "no-store" });
        if (!response.body) throw new Error("missing_response");
        const bytes = await readBoundedStream(response.body, 12 * 1024 * 1024, requestController.signal, 10_000);
        const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
        if (!response.ok) {
          const name = typeof value === "object" && value !== null && "error" in value && typeof value.error === "string" ? value.error : "";
          const retry = response.headers.get("retry-after");
          const retryMs = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now())) : 500;
          throw new HttpError(response.status, name, Number.isFinite(retryMs) ? Math.max(500, retryMs) : 500);
        }
        const creditValue = response.headers.get("x-fashn-credits-used");
        const credits = creditValue !== null && /^\d+$/.test(creditValue) && Number(creditValue) <= 1000 ? Number(creditValue) : undefined;
        return { value, credits };
      } finally { clearTimeout(timer); controller.signal.removeEventListener("abort", stop); }
    };

    try {
      if (externalSignal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const dataUri = (image: VirtualTryOnRequest["image"]) => `data:${image.mimeType};base64,${Buffer.from(image.bytes).toString("base64")}`;
      let submission;
      try {
        // Exactly one billable POST. Ambiguous failures are never automatically replayed.
        submission = await readJson("POST", "run", { model_name: "tryon-max", inputs: { model_image: dataUri(input.image), product_image: dataUri(input.garmentImage), generation_mode: "balanced", resolution: "1k", num_images: 1, output_format: "jpeg", return_base64: true } });
      } catch (error) {
        if (error instanceof HttpError && error.status < 500) {
          const code = error.status === 401 ? "authentication" : error.nameCode === "OutOfCredits" ? "credits" : error.status === 429 ? "rate_limit" : "invalid_input";
          throw new VirtualTryOnProviderError(code, undefined, true);
        }
        throw new VirtualTryOnProviderError("submission_unknown");
      }
      const prediction = predictionSchema.safeParse(submission.value);
      if (!prediction.success) throw new VirtualTryOnProviderError("submission_unknown");
      providerId = prediction.data.id;
      await input.onSubmitted?.(providerId);
      while (true) {
        await pause(this.options.pollMs ?? 2500, controller.signal);
        let statusResponse: Awaited<ReturnType<typeof readJson>> | undefined;
        for (let attempt = 0; attempt < 3; attempt++) {
          try { statusResponse = await readJson("GET", `status/${encodeURIComponent(providerId)}`); break; }
          catch (error) {
            if (controller.signal.aborted) throw error;
            if (error instanceof HttpError && error.nameCode === "OutOfCredits") throw new VirtualTryOnProviderError("credits", providerId);
            if (error instanceof HttpError && error.status !== 429 && error.status < 500) throw new VirtualTryOnProviderError("failed", providerId);
            if (attempt === 2) throw new VirtualTryOnProviderError("failed", providerId);
            await pause(error instanceof HttpError ? error.retryAfterMs : 500 * 2 ** attempt, controller.signal);
          }
        }
        const status = statusSchema.safeParse(statusResponse?.value);
        if (!status.success) throw new VirtualTryOnProviderError("invalid_response", providerId);
        if (status.data.status === "failed") throw new VirtualTryOnProviderError("failed", providerId, true);
        if (status.data.status !== "completed") continue;
        const decoded = decodePrivateFittingImage(status.data.output?.[0] ?? "");
        if (!decoded) throw new VirtualTryOnProviderError("invalid_response", providerId, true);
        let image;
        try { image = await normalizeFittingImage(decoded.bytes, decoded.mimeType); }
        catch { throw new VirtualTryOnProviderError("invalid_response", providerId, true); }
        return { resultUrl: `data:${image.mimeType};base64,${Buffer.from(image.bytes).toString("base64")}`, providerRequestId: providerId, creditsUsed: statusResponse?.credits };
      }
    } catch (error) {
      if (externalSignal?.aborted) throw new DOMException("Cancelled", "AbortError");
      if (controller.signal.aborted) throw new VirtualTryOnTimeoutError(providerId);
      if (error instanceof VirtualTryOnProviderError) throw error;
      throw new VirtualTryOnProviderError(providerId ? "failed" : "submission_unknown", providerId);
    } finally { clearTimeout(deadline); externalSignal?.removeEventListener("abort", abort); }
  }
}
