import { fittingConsentVersion, fittingResultSchema, fittingSubmissionSchema, type FittingErrorCode, type FittingResult, type FittingSelection } from "./contracts";

export class FittingRequestError extends Error {
  constructor(public readonly code: FittingErrorCode) { super(code); this.name = "FittingRequestError"; }
}

const responseErrors: Record<string, FittingErrorCode> = {
  not_configured: "not_configured", not_enabled: "not_enabled", consent_required: "consent_required",
  invalid_request: "invalid_selection", invalid_image: "invalid_image", variant_unavailable: "variant_unavailable",
  product_image_unavailable: "product_image_unavailable", rate_limited: "rate_limited", request_too_large: "request_too_large",
  timeout: "timeout", duplicate_request: "duplicate_request",
  budget_exhausted: "budget_exhausted", usage_limit: "usage_limit", concurrency_limit: "concurrency_limit", submission_unknown: "submission_unknown",
};

type RequestOptions = {
  requestId?: string;
  selection: FittingSelection;
  photo: File;
  consent: boolean;
  signal: AbortSignal;
  onProgress: (progress: number | null) => void;
  onUploaded: () => void;
};

export function sendFittingRequest(options: RequestOptions): Promise<FittingResult> {
  if (!options.consent) return Promise.reject(new FittingRequestError("consent_required"));
  if (options.signal.aborted) return Promise.reject(new DOMException("Cancelled", "AbortError"));
  const fields = fittingSubmissionSchema.safeParse({ ...options.selection, requestId: options.requestId ?? crypto.randomUUID(), consent: "true", consentVersion: fittingConsentVersion });
  if (!fields.success) return Promise.reject(new FittingRequestError("invalid_selection"));
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let finished = false;
    const cleanup = () => options.signal.removeEventListener("abort", abort);
    const fail = (error: Error) => { if (finished) return; finished = true; cleanup(); reject(error); };
    const abort = () => { request.abort(); fail(new DOMException("Cancelled", "AbortError")); };
    request.open("POST", "/api/virtual-fitting");
    request.timeout = 120_000;
    request.upload.onprogress = event => options.onProgress(event.lengthComputable && event.total > 0 ? Math.round(event.loaded / event.total * 100) : null);
    request.upload.onload = () => { if (!finished && !options.signal.aborted) options.onUploaded(); };
    request.onerror = () => fail(new FittingRequestError("network"));
    request.ontimeout = () => fail(new FittingRequestError("timeout"));
    request.onabort = () => fail(new DOMException("Cancelled", "AbortError"));
    request.onload = () => {
      if (finished || options.signal.aborted) return;
      let data: unknown;
      try { data = JSON.parse(request.responseText); } catch { fail(new FittingRequestError("invalid_response")); return; }
      if (request.status < 200 || request.status >= 300) {
        const error = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "";
        fail(new FittingRequestError(responseErrors[error] ?? "provider_unavailable")); return;
      }
      const parsed = fittingResultSchema.safeParse(data);
      if (!parsed.success) { fail(new FittingRequestError("invalid_response")); return; }
      finished = true; cleanup(); resolve(parsed.data);
    };
    options.signal.addEventListener("abort", abort, { once: true });
    const body = new FormData();
    for (const [key, value] of Object.entries(fields.data)) body.set(key, value);
    const extension = options.photo.type === "image/png" ? "png" : options.photo.type === "image/webp" ? "webp" : "jpg";
    body.set("image", options.photo, `photograph.${extension}`);
    try { request.send(body); } catch { fail(new FittingRequestError("network")); }
  });
}
