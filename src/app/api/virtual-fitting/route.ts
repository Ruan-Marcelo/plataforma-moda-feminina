import { NextResponse } from "next/server";
import { validateVirtualTryOnImage } from "@/features/virtual-fitting/validation";
import { fittingSubmissionSchema, fittingResultSchema, hasProviderImage } from "@/features/virtual-fitting/contracts";
import { findPublishedProductById } from "@/features/products/repository";
import { findAvailableVariant } from "@/features/products/selection";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { FashnVirtualTryOnProvider } from "@/features/virtual-fitting/fashn-provider";
import { VirtualTryOnProviderError, VirtualTryOnTimeoutError } from "@/features/virtual-fitting/types";

export const runtime = "nodejs";
function reply(data: unknown, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(request: Request) {
  if (!env.DATABASE_URL || !env.FASHN_API_KEY) return reply({ error: "not_configured" }, 503);
  if (!env.VIRTUAL_FITTING_ENABLED) return reply({ error: "not_enabled" }, 503);
  if (Number(request.headers.get("content-length") ?? 0) > 9 * 1024 * 1024) return reply({ error: "request_too_large" }, 413);
  const form = await request.formData().catch(() => null);
  if (form?.get("consent") !== "true") return reply({ error: "consent_required" }, 400);
  const parsed = fittingSubmissionSchema.safeParse(Object.fromEntries(["productId", "variantId", "requestId", "consent", "consentVersion"].map(key => [key, form.getAll(key).length === 1 ? form.get(key) : undefined])));
  const image = form.get("image");
  if (!parsed.success || !(image instanceof File) || form.getAll("image").length !== 1) return reply({ error: "invalid_request" }, 400);
  try { await validateVirtualTryOnImage(image); } catch { return reply({ error: "invalid_image" }, 400); }
  const source = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ?? "unknown";
  const rate = consumeRateLimit(`virtual-fitting:${source}`, 3, 10 * 60 * 1000);
  if (!rate.allowed) return reply({ error: "rate_limited" }, 429, { "Retry-After": String(rate.retryAfterSeconds) });
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort", abort, { once: true });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    if (request.signal.aborted) return reply({ error: "cancelled" }, 499);
    const product = await findPublishedProductById(parsed.data.productId);
    const variant = product ? findAvailableVariant(product.variants, parsed.data.variantId) : null;
    if (!product || !variant) return reply({ error: "variant_unavailable" }, 409);
    const garmentImageUrl = product.images[0]?.url;
    if (!garmentImageUrl || !hasProviderImage(garmentImageUrl)) return reply({ error: "product_image_unavailable" }, 422);
    const duplicate = consumeRateLimit(`virtual-fitting-request:${parsed.data.requestId}`, 1, 10 * 60 * 1000);
    if (!duplicate.allowed) return reply({ error: "duplicate_request" }, 409);
    timeout = setTimeout(abort, 70_000);
    const provider = new FashnVirtualTryOnProvider();
    const result = await provider.generate({ productId: product.id, variantId: variant.id, image, garmentImageUrl }, controller.signal);
    if (request.signal.aborted) return reply({ error: "cancelled" }, 499);
    const validated = fittingResultSchema.safeParse(result);
    if (!validated.success) return reply({ error: "provider_unavailable" }, 502);
    return reply(validated.data, 200);
  } catch (error) {
    if (request.signal.aborted) return reply({ error: "cancelled" }, 499);
    if (error instanceof VirtualTryOnTimeoutError || (error instanceof Error && error.name === "AbortError")) return reply({ error: "timeout" }, 504);
    if (error instanceof VirtualTryOnProviderError) return reply({ error: "provider_unavailable" }, 502);
    return reply({ error: "provider_unavailable" }, 503);
  } finally {
    if (timeout) clearTimeout(timeout);
    request.signal.removeEventListener("abort", abort);
  }
}
