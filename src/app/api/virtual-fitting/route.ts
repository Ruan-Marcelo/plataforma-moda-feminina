import { NextResponse } from "next/server";
import { fittingSubmissionSchema, fittingResultSchema, catalogImageIsReadable } from "@/features/virtual-fitting/contracts";
import { findPublishedProductById } from "@/features/products/repository";
import { findAvailableVariant } from "@/features/products/selection";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { FashnVirtualTryOnProvider } from "@/features/virtual-fitting/fashn-provider";
import { VirtualTryOnProviderError, VirtualTryOnTimeoutError } from "@/features/virtual-fitting/types";
import { readFittingForm, FittingBodyError } from "@/features/virtual-fitting/bounded-body";
import { normalizeFittingImage, FittingImageError } from "@/features/virtual-fitting/server-image";
import { readGarmentImage } from "@/features/virtual-fitting/garment-image";
import { reserveFittingOperation, markFittingSubmitted, finishFittingOperation, FittingLimitError } from "@/features/virtual-fitting/operation-repository";
import { fittingOwner, fittingTechnicalEvent } from "@/features/virtual-fitting/ownership";

export const runtime = "nodejs";
class GarmentInputError extends Error {}
function reply(data: unknown, status: number) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" } });
}

export async function POST(request: Request) {
  if (!env.DATABASE_URL || !env.FASHN_API_KEY || !env.AUTH_SECRET) return reply({ error: "not_configured" }, 503);
  if (!env.VIRTUAL_FITTING_ENABLED || !env.FASHN_SPENDING_APPROVED || env.FASHN_DAILY_CREDIT_LIMIT < 2) return reply({ error: "not_enabled" }, 503);
  const origin = request.headers.get("origin");
  const allowedOrigins = [new URL(env.NEXT_PUBLIC_APP_URL).origin, ...(env.NODE_ENV !== "production" ? [new URL(request.url).origin] : [])];
  if (origin && !allowedOrigins.includes(origin)) return reply({ error: "invalid_request" }, 403);
  const owner = fittingOwner(request.headers.get("cookie"), env.AUTH_SECRET, env.NODE_ENV === "production");
  const respond = (data: unknown, status: number) => {
    const response = reply(data, status);
    response.cookies.set(owner.name, owner.token, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 86400 });
    return response;
  };
  const rate = consumeRateLimit(`vto-admission:${owner.hash}`, 3, 10 * 60 * 1000);
  if (!rate.allowed) return respond({ error: "rate_limited" }, 429);
  let operation: { id: string } | undefined;
  let started = false;
  const startedAt = Date.now();
  try {
    let form: FormData | null;
    try { form = await readFittingForm(request); }
    catch (error) { if (error instanceof FittingBodyError || request.signal.aborted) throw error; return respond({ error: "invalid_request" }, 400); }
    if (form?.get("consent") !== "true") return respond({ error: "consent_required" }, 400);
    const parsed = fittingSubmissionSchema.safeParse(Object.fromEntries(["productId", "variantId", "requestId", "consent", "consentVersion"].map(key => [key, form.getAll(key).length === 1 ? form.get(key) : undefined])));
    const photo = form.get("image");
    if (!parsed.success || !(photo instanceof File) || form.getAll("image").length !== 1 || photo.size > 8 * 1024 * 1024) return respond({ error: "invalid_request" }, 400);
    const product = await findPublishedProductById(parsed.data.productId);
    const variant = product ? findAvailableVariant(product.variants, parsed.data.variantId) : null;
    if (!product || !variant) return respond({ error: "variant_unavailable" }, 409);
    const image = await normalizeFittingImage(new Uint8Array(await photo.arrayBuffer()), photo.type);
    const storageKey = product.images[0]?.storageKey;
    if (!catalogImageIsReadable(product.id, storageKey)) return respond({ error: "product_image_unavailable" }, 422);
    operation = await reserveFittingOperation({ requestId: parsed.data.requestId, ownerHash: owner.hash, productId: product.id, variantId: variant.id, consentVersion: parsed.data.consentVersion }, { dailyCredits: env.FASHN_DAILY_CREDIT_LIMIT, ownerDailyRequests: env.FASHN_OWNER_DAILY_LIMIT, concurrent: env.FASHN_MAX_CONCURRENT });
    fittingTechnicalEvent("started", operation.id);
    if (request.signal.aborted) throw new DOMException("Cancelled", "AbortError");
    // Refuse exhausted quotas before reading S3; storage reads can also have a monetary cost.
    let garmentImage;
    try { garmentImage = await readGarmentImage(product.id, storageKey, request.signal); }
    catch { throw new GarmentInputError(); }
    started = true;
    const operationId = operation.id;
    const result = await new FashnVirtualTryOnProvider().generate({ productId: product.id, variantId: variant.id, image, garmentImage, onSubmitted: async providerRequestId => {
      fittingTechnicalEvent("submitted", operationId, { providerRequestId });
      await markFittingSubmitted(operationId, providerRequestId);
    } }, request.signal);
    const validated = fittingResultSchema.safeParse({ resultUrl: result.resultUrl, operationId });
    if (!validated.success) throw new VirtualTryOnProviderError("invalid_response", result.providerRequestId, true);
    await finishFittingOperation(operationId, { status: "COMPLETED", settled: true, actualCredits: result.creditsUsed });
    fittingTechnicalEvent("completed", operationId, { durationMs: Date.now() - startedAt });
    if (request.signal.aborted) return respond({ error: "cancelled", operationId }, 499);
    // No provider URL, raw prediction ID or cached/shared result is exposed to another request.
    return respond(validated.data, 200);
  } catch (error) {
    const cancelled = request.signal.aborted || (error instanceof Error && error.name === "AbortError") || (error instanceof FittingBodyError && error.code === "cancelled");
    const code = cancelled ? "cancelled" : error instanceof FittingLimitError ? error.code : error instanceof GarmentInputError ? "product_image_unavailable" : error instanceof FittingImageError ? "invalid_image" : error instanceof FittingBodyError ? error.code : error instanceof VirtualTryOnTimeoutError ? "timeout" : error instanceof VirtualTryOnProviderError && error.code === "submission_unknown" ? "submission_unknown" : "provider_unavailable";
    if (operation) {
      const settled = !started || (error instanceof VirtualTryOnProviderError && error.settled);
      const technicalCode = error instanceof VirtualTryOnProviderError ? `provider_${error.code}` : code;
      await finishFittingOperation(operation.id, { status: cancelled ? "CANCELLED" : code === "timeout" ? "TIMED_OUT" : code === "submission_unknown" ? "UNKNOWN" : "FAILED", errorCode: technicalCode, settled }).catch(() => fittingTechnicalEvent("failed", operation!.id, { code: "tracking_unavailable" }));
      fittingTechnicalEvent("failed", operation.id, { code: technicalCode, durationMs: Date.now() - startedAt });
    }
    const status = cancelled ? 499 : error instanceof FittingLimitError ? 429 : code === "request_too_large" ? 413 : code === "product_image_unavailable" ? 422 : code === "invalid_image" ? 400 : code === "timeout" ? 504 : 503;
    return respond({ error: code, ...(operation ? { operationId: operation.id } : {}) }, status);
  }
}
