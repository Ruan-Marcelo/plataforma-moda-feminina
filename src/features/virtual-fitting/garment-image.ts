import { getObjectStorage } from "@/lib/storage/object-storage";
import { normalizeFittingImage } from "./server-image";
import { catalogImageIsReadable } from "./contracts";

export async function readGarmentImage(productId: string, storageKey: string | null | undefined, signal?: AbortSignal) {
  if (!storageKey || !catalogImageIsReadable(productId, storageKey)) throw new Error("product_image_unavailable");
  const image = await getObjectStorage().read(storageKey, signal);
  return normalizeFittingImage(image.body, image.contentType);
}
