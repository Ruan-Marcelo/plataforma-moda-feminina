import { describe, expect, it } from "vitest";
import { fittingReducer, initialFittingState, type FittingState } from "@/features/virtual-fitting/state";
import { fittingConsentVersion, fittingResultSchema, fittingSubmissionSchema, hasProviderImage } from "@/features/virtual-fitting/contracts";

const selection = { productId: "cm123456789012345678901234", variantId: "cm123456789012345678901235" };
const photo = new File([new Uint8Array([0xff, 0xd8, 0xff])], "fixture.jpg", { type: "image/jpeg" });
const result = { resultUrl: "https://cdn.fashn.ai/test-fixture.jpg" };

function prepared(): FittingState {
  let state = initialFittingState(selection);
  for (const action of [{ type: "start" }, { type: "confirm_selection" }, { type: "check_photo" }, { type: "photo_ready", photo }, { type: "confirm_photo" }] as const) state = fittingReducer(state, action);
  return state;
}

describe("virtual fitting state machine", () => {
  it("requires a selection, validated photo and consent before uploading", () => {
    expect(fittingReducer(initialFittingState(null), { type: "submit" }).status).toBe("idle");
    const state = prepared();
    expect(fittingReducer(state, { type: "submit" })).toBe(state);
    const accepted = fittingReducer(state, { type: "consent", accepted: true });
    const uploading = fittingReducer(accepted, { type: "submit" });
    expect(uploading.status).toBe("uploading");
    expect(fittingReducer(uploading, { type: "submit" })).toBe(uploading);
    expect(fittingReducer(uploading, { type: "edit_selection" })).toBe(uploading);
  });

  it("supports all required request states without fabricating completion", () => {
    const ready = fittingReducer(prepared(), { type: "consent", accepted: true });
    const uploading = fittingReducer(ready, { type: "submit" });
    const processing = fittingReducer(uploading, { type: "uploaded" });
    expect(processing.status).toBe("processing");
    expect(processing.result).toBeNull();
    const failed = fittingReducer(processing, { type: "fail", error: "timeout" });
    expect(failed.status).toBe("failed");
    expect(failed.result).toBeNull();
    const retry = fittingReducer(failed, { type: "submit" });
    const completed = fittingReducer(retry, { type: "complete", result });
    expect(completed.status).toBe("completed");
    expect(completed.result).toEqual(result);
    const cancelled = fittingReducer(completed, { type: "cancel" });
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.photo).toBeNull();
    expect(cancelled.result).toBeNull();
    expect(cancelled.consent).toBe(false);
    expect(fittingReducer(cancelled, { type: "restart" }).status).toBe("idle");
  });

  it("ignores late responses after cancellation and clears private data for another piece", () => {
    const cancelled = fittingReducer(prepared(), { type: "cancel" });
    expect(fittingReducer(cancelled, { type: "complete", result })).toBe(cancelled);
    const next = fittingReducer(prepared(), { type: "another_piece" });
    expect(next).toMatchObject({ step: "selection", status: "idle", selection: null, photo: null, result: null, consent: false });
  });

  it("revokes consent on photo replacement or selection changes", () => {
    const accepted = fittingReducer(prepared(), { type: "consent", accepted: true });
    expect(fittingReducer(accepted, { type: "check_photo" })).toMatchObject({ photo: null, consent: false, checkingPhoto: true });
    expect(fittingReducer(accepted, { type: "select", selection })).toMatchObject({ photo: null, consent: false });
    expect(fittingReducer(accepted, { type: "invalid_photo" })).toMatchObject({ status: "failed", photo: null, consent: false });
  });
});

describe("fitting contracts", () => {
  it("requires versioned consent and complete selection identifiers", () => {
    const request = { ...selection, requestId: crypto.randomUUID(), consent: "true", consentVersion: fittingConsentVersion };
    expect(fittingSubmissionSchema.safeParse(request).success).toBe(true);
    expect(fittingSubmissionSchema.safeParse({ ...request, consent: "false" }).success).toBe(false);
    expect(fittingSubmissionSchema.safeParse({ ...request, consentVersion: "old-version" }).success).toBe(false);
    expect(fittingSubmissionSchema.safeParse({ ...request, variantId: "invalid" }).success).toBe(false);
  });

  it("accepts result URLs only from the actual provider CDN", () => {
    expect(fittingResultSchema.safeParse(result).success).toBe(true);
    for (const resultUrl of ["javascript:alert(1)", "http://cdn.fashn.ai/result.jpg", "https://cdn.fashn.ai.attacker.test/result.jpg", "https://user:password@cdn.fashn.ai/result.jpg", "/demo/blusa-frente.svg"]) expect(fittingResultSchema.safeParse({ resultUrl }).success).toBe(false);
  });

  it("does not treat local illustrations or private URLs as provider-ready garment photos", () => {
    for (const url of [undefined, "/demo/blusa-frente.svg", "https://localhost/item.jpg", "https://127.0.0.1/item.jpg", "https://192.168.0.2/item.jpg", "https://example.com/item.svg"]) expect(hasProviderImage(url)).toBe(false);
    expect(hasProviderImage("https://example.com/catalog/item.jpg")).toBe(true);
  });
});
