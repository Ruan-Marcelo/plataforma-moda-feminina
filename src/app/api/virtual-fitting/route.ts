// RUAN MARCELO RAMACIOTI LUZ
import { NextResponse } from "next/server";
import { virtualTryOnRequestSchema, validateVirtualTryOnImage } from "@/features/virtual-fitting/validation";
import { findPublishedProductById } from "@/features/products/repository";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { FashnVirtualTryOnProvider } from "@/features/virtual-fitting/fashn-provider";
import { VirtualTryOnNotConfiguredError, VirtualTryOnProviderError, VirtualTryOnTimeoutError } from "@/features/virtual-fitting/types";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!env.DATABASE_URL || !env.FASHN_API_KEY) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 9 * 1024 * 1024) return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  const source = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ?? "unknown";
  const rate = consumeRateLimit(`virtual-fitting:${source}`, 3, 10 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const formData = await request.formData().catch(() => null);
  const parsed = virtualTryOnRequestSchema.safeParse({ productId: formData?.get("productId") });
  const image = formData?.get("image");
  if (!parsed.success || !(image instanceof File)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try { await validateVirtualTryOnImage(image); } catch { return NextResponse.json({ error: "invalid_image" }, { status: 400 }); }
  try {
    const product = await findPublishedProductById(parsed.data.productId);
    const garmentImageUrl = product?.images[0]?.url;
    if (!garmentImageUrl) return NextResponse.json({ error: "product_image_unavailable" }, { status: 422 });
    const provider = new FashnVirtualTryOnProvider();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 70_000);
    const result = await provider.generate({ productId: parsed.data.productId, image, garmentImageUrl }, controller.signal).finally(() => clearTimeout(timeout));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof VirtualTryOnNotConfiguredError) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    if (error instanceof VirtualTryOnTimeoutError || error instanceof Error && error.name === "AbortError") return NextResponse.json({ error: "timeout" }, { status: 504 });
    if (error instanceof VirtualTryOnProviderError) return NextResponse.json({ error: "provider_unavailable" }, { status: 502 });
    return NextResponse.json({ error: "try_on_unavailable" }, { status: 503 });
  }
}
