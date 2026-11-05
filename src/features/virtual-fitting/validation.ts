// RUAN MARCELO RAMACIOTI LUZ
import { z } from "zod";
export const virtualTryOnRequestSchema = z.object({ productId: z.string().cuid() });
export const maxVirtualTryOnFileSize = 8 * 1024 * 1024;
export const supportedVirtualTryOnMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
function startsWith(bytes: Uint8Array, signature: number[]) { return signature.every((byte, index) => bytes[index] === byte); }
export function hasSupportedImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (mimeType === "image/png") return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimeType === "image/webp") return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}
export async function validateVirtualTryOnImage(file: File | null) {
  if (!file) throw new Error("An image is required");
  if (!supportedVirtualTryOnMimeTypes.includes(file.type as (typeof supportedVirtualTryOnMimeTypes)[number])) throw new Error("Unsupported image type");
  if (file.size <= 0 || file.size > maxVirtualTryOnFileSize) throw new Error("Image size is invalid");
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!hasSupportedImageSignature(bytes, file.type)) throw new Error("Image content does not match its MIME type");
  return file;
}
