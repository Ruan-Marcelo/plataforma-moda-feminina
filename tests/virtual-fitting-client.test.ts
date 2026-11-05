import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendFittingRequest } from "@/features/virtual-fitting/client";
import { fittingConsentVersion } from "@/features/virtual-fitting/contracts";

class TestXHR {
  static instances: TestXHR[] = [];
  upload: { onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void; onload?: () => void } = {};
  onload?: () => void;
  onerror?: () => void;
  ontimeout?: () => void;
  onabort?: () => void;
  status = 200;
  timeout = 0;
  responseText = "";
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn(() => this.onabort?.());
  constructor() { TestXHR.instances.push(this); }
}

function options(consent = true) {
  return {
    selection: { productId: "cm123456789012345678901234", variantId: "cm123456789012345678901235" },
    photo: new File([new Uint8Array([0xff, 0xd8, 0xff])], "personal-filename.jpg", { type: "image/jpeg" }),
    consent, signal: new AbortController().signal, onProgress: vi.fn(), onUploaded: vi.fn(),
  };
}

beforeEach(() => { TestXHR.instances = []; vi.stubGlobal("XMLHttpRequest", TestXHR); });
afterEach(() => vi.unstubAllGlobals());

describe("fitting browser transport (isolated XHR contract tests)", () => {
  it("does not construct a request without consent", async () => {
    await expect(sendFittingRequest(options(false))).rejects.toMatchObject({ code: "consent_required" });
    expect(TestXHR.instances).toHaveLength(0);
  });

  it("sends exact IDs, versioned consent and a neutral filename; progress comes from XHR", async () => {
    const input = options();
    const request = sendFittingRequest(input);
    const xhr = TestXHR.instances[0];
    const body = xhr.send.mock.calls[0][0] as FormData;
    expect(body.get("variantId")).toBe(input.selection.variantId);
    expect(body.get("consentVersion")).toBe(fittingConsentVersion);
    expect((body.get("image") as File).name).toBe("photograph.jpg");
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    expect(input.onProgress).toHaveBeenCalledWith(25);
    xhr.upload.onload?.();
    expect(input.onUploaded).toHaveBeenCalledOnce();
    xhr.responseText = JSON.stringify({ resultUrl: "https://cdn.fashn.ai/contract-test.jpg" });
    xhr.onload?.();
    await expect(request).resolves.toEqual({ resultUrl: "https://cdn.fashn.ai/contract-test.jpg" });
  });

  it("rejects unsafe result URLs and surfaces unconfigured service errors", async () => {
    const unsafe = sendFittingRequest(options());
    TestXHR.instances[0].responseText = JSON.stringify({ resultUrl: "https://untrusted.example/result.jpg" });
    TestXHR.instances[0].onload?.();
    await expect(unsafe).rejects.toMatchObject({ code: "invalid_response" });
    const unavailable = sendFittingRequest(options());
    const xhr = TestXHR.instances[1];
    xhr.status = 503; xhr.responseText = JSON.stringify({ error: "not_configured" }); xhr.onload?.();
    await expect(unavailable).rejects.toMatchObject({ code: "not_configured" });
  });

  it("aborts an in-flight request and rejects a late response", async () => {
    const controller = new AbortController();
    const request = sendFittingRequest({ ...options(), signal: controller.signal });
    const xhr = TestXHR.instances[0];
    controller.abort();
    xhr.responseText = JSON.stringify({ resultUrl: "https://cdn.fashn.ai/late-test.jpg" });
    xhr.onload?.();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(xhr.abort).toHaveBeenCalledOnce();
  });

  it("handles network failures, timeouts and malformed responses", async () => {
    for (const kind of ["network", "timeout", "invalid_response"] as const) {
      const request = sendFittingRequest(options());
      const xhr = TestXHR.instances.at(-1)!;
      if (kind === "network") xhr.onerror?.();
      if (kind === "timeout") xhr.ontimeout?.();
      if (kind === "invalid_response") { xhr.responseText = "not json"; xhr.onload?.(); }
      await expect(request).rejects.toMatchObject({ code: kind });
    }
  });
});
