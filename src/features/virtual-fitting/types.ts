// RUAN MARCELO RAMACIOTI LUZ
import type { NormalizedFittingImage } from "./server-image";
export type VirtualTryOnRequest = { productId: string; variantId: string; image: NormalizedFittingImage; garmentImage: NormalizedFittingImage; onSubmitted?: (providerRequestId: string) => Promise<void> };
export type VirtualTryOnResult = { resultUrl: string; providerRequestId: string; creditsUsed?: number };
export interface VirtualTryOnProvider { generate(request: VirtualTryOnRequest, signal?: AbortSignal): Promise<VirtualTryOnResult>; }
export class VirtualTryOnNotConfiguredError extends Error { constructor() { super("Virtual try-on provider is not configured"); this.name = "VirtualTryOnNotConfiguredError"; } }
export class VirtualTryOnProviderError extends Error { constructor(public readonly code: "failed" | "authentication" | "credits" | "rate_limit" | "invalid_input" | "submission_unknown" | "invalid_response" = "failed", public readonly providerRequestId?: string, public readonly settled = false) { super(code); this.name = "VirtualTryOnProviderError"; } }
export class VirtualTryOnTimeoutError extends Error { constructor(public readonly providerRequestId?: string) { super("timeout"); this.name = "VirtualTryOnTimeoutError"; } }
export class UnconfiguredVirtualTryOnProvider implements VirtualTryOnProvider { async generate(_request: VirtualTryOnRequest, _signal?: AbortSignal): Promise<VirtualTryOnResult> { void _request; void _signal; throw new VirtualTryOnNotConfiguredError(); } }
