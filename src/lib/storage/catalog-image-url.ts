type CatalogImage = { url: string; storageKey: string | null };

export function catalogImageUrl(image: CatalogImage) {
  if (!image.storageKey) return image.url;
  const valid = /^products\/c[a-z0-9]+\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(image.storageKey);
  return valid ? `/api/catalog-images/${image.storageKey}` : "/api/catalog-images/invalid";
}

export function withCatalogImageUrls<T extends { images: CatalogImage[] }>(product: T): T {
  return { ...product, images: product.images.map(image => ({ ...image, url: catalogImageUrl(image) })) };
}
