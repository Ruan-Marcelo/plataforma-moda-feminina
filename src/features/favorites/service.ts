import type { FavoriteProduct } from "./contracts";
type Product = { id: string; name: string; slug: string; priceCents: number | null; images: Array<{ url: string; alt: string }>; variants: Array<{ available: boolean }> };
export function toFavoriteProduct(product: Product, showPrices: boolean): FavoriteProduct {
  const image = product.images[0];
  return { id: product.id, name: product.name, slug: product.slug, priceCents: showPrices ? product.priceCents : null, image: image ? { url: image.url, alt: image.alt } : null, available: product.variants.some(variant => variant.available), availabilityKnown: product.variants.length > 0 };
}
