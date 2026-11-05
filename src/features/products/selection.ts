import { z } from "zod";

export const productSelectionSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid(),
});

export type ProductVariant = {
  id: string;
  size: string;
  color: string;
  colorHex: string | null;
  available: boolean;
};

export function findAvailableVariant(variants: ProductVariant[], variantId: string) {
  return variants.find(variant => variant.id === variantId && variant.available) ?? null;
}

export function selectVariantForColor(variants: ProductVariant[], color: string, preferredSize?: string) {
  return variants.find(variant => variant.color === color && variant.size === preferredSize && variant.available)
    ?? variants.find(variant => variant.color === color && variant.available)
    ?? null;
}

export function getVariantSizes(variants: ProductVariant[], color: string) {
  return [...new Set(variants.map(variant => variant.size))].map(size => {
    const variant = variants.find(candidate => candidate.color === color && candidate.size === size);
    return { size, exists: Boolean(variant), available: variant?.available ?? false };
  });
}

export function createFittingPath(productId: string, variantId: string) {
  const selection = productSelectionSchema.parse({ productId, variantId });
  return `/provador?${new URLSearchParams(selection)}`;
}
