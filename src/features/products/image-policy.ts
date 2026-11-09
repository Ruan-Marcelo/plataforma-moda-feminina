// Optimize only published local catalog assets. Never proxy arbitrary external or private URLs.
export function canOptimizeCatalogImage(url: string) {
  return /^\/api\/local-images\/products\/c[a-z0-9]+\/[0-9a-f-]+\.(jpg|png|webp)$/.test(url);
}
