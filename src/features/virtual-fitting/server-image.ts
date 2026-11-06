import sharp from "sharp";
import { hasSupportedImageSignature, maxVirtualTryOnFileSize } from "./validation";

// Private processing buffers must not enter libvips' reusable operation cache.
sharp.cache(false);

export type NormalizedFittingImage = { bytes: Uint8Array; mimeType: "image/jpeg" };
export class FittingImageError extends Error { constructor() { super("invalid_image"); } }

export async function normalizeFittingImage(bytes: Uint8Array, mimeType: string): Promise<NormalizedFittingImage> {
  if (!bytes.length || bytes.length > maxVirtualTryOnFileSize || !hasSupportedImageSignature(bytes.subarray(0, 16), mimeType)) throw new FittingImageError();
  try {
    const image = sharp(bytes, { limitInputPixels: 16_000_000, failOn: "error" });
    const metadata = await image.metadata();
    const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[mimeType];
    const { width = 0, height = 0 } = metadata;
    if (metadata.format !== expected || width < 15 || height < 15 || width / height > 16 || height / width > 16 || (metadata.pages ?? 1) > 1) throw new FittingImageError();
    // Decode the whole image, honor EXIF orientation and strip metadata from the processing copy.
    const output = await image.rotate().flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
    if (output.byteLength > maxVirtualTryOnFileSize) throw new FittingImageError();
    return { bytes: new Uint8Array(output), mimeType: "image/jpeg" };
  } catch { throw new FittingImageError(); }
}
