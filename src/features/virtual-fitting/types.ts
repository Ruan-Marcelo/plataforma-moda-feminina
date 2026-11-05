// RUAN MARCELO RAMACIOTI LUZ
export type VirtualTryOnRequest = { productId: string; variantId: string; image: File; garmentImageUrl: string };
export type VirtualTryOnResult = { resultUrl: string; providerRequestId?: string };
export interface VirtualTryOnProvider { generate(request: VirtualTryOnRequest, signal?: AbortSignal): Promise<VirtualTryOnResult>; }
export class VirtualTryOnNotConfiguredError extends Error { constructor() { super("Virtual try-on provider is not configured"); this.name = "VirtualTryOnNotConfiguredError"; } }
export class VirtualTryOnProviderError extends Error { constructor() { super("Virtual try-on provider failed"); this.name = "VirtualTryOnProviderError"; } }
export class VirtualTryOnTimeoutError extends Error { constructor() { super("Virtual try-on provider timed out"); this.name = "VirtualTryOnTimeoutError"; } }
export class UnconfiguredVirtualTryOnProvider implements VirtualTryOnProvider { async generate(_request: VirtualTryOnRequest, _signal?: AbortSignal): Promise<VirtualTryOnResult> { void _request; void _signal; throw new VirtualTryOnNotConfiguredError(); } }
