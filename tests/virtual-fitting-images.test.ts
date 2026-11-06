import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { normalizeFittingImage } from "@/features/virtual-fitting/server-image";
import { readBoundedStream } from "@/lib/security/bounded-stream";
import { fittingOwner } from "@/features/virtual-fitting/ownership";

describe("server image and privacy validation", () => {
  it("fully decodes images and removes embedded metadata from the processing copy", async () => {
    const original = await sharp({ create: { width: 40, height: 60, channels: 3, background: "#8d263b" } }).withExif({ IFD0: { Artist: "private-test-marker" } }).jpeg().toBuffer();
    const normalized = await normalizeFittingImage(original, "image/jpeg");
    const metadata = await sharp(normalized.bytes).metadata();
    expect(metadata.width).toBe(40);
    expect(metadata.height).toBe(60);
    expect(metadata.exif).toBeUndefined();
    expect(Buffer.from(normalized.bytes).includes(Buffer.from("private-test-marker"))).toBe(false);
  });

  it("rejects a truncated JPEG despite its signature, unsupported contents and undersized images", async () => {
    await expect(normalizeFittingImage(new Uint8Array([255, 216, 255]), "image/jpeg")).rejects.toThrow("invalid_image");
    const tiny = await sharp({ create: { width: 1, height: 1, channels: 3, background: "white" } }).png().toBuffer();
    await expect(normalizeFittingImage(tiny, "image/png")).rejects.toThrow("invalid_image");
    await expect(normalizeFittingImage(new TextEncoder().encode("<svg></svg>"), "image/svg+xml")).rejects.toThrow("invalid_image");
  });

  it("enforces actual streamed byte counts without trusting Content-Length", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(3)); controller.enqueue(new Uint8Array(3)); }, cancel() { cancelled = true; } });
    await expect(readBoundedStream(stream, 5)).rejects.toMatchObject({ code: "request_too_large" });
    expect(cancelled).toBe(true);
  });

  it("uses opaque separate sessions and stores only a keyed hash for ownership", () => {
    const first = fittingOwner(null, "test-secret", false);
    const second = fittingOwner(null, "test-secret", false);
    expect(first.token).not.toBe(second.token);
    expect(first.hash).not.toBe(first.token);
    expect(fittingOwner(`${first.name}=${first.token}`, "test-secret", false).hash).toBe(first.hash);
    expect(fittingOwner(`${first.name}=${first.token}`, "different-secret", false).hash).not.toBe(first.hash);
  });
});
