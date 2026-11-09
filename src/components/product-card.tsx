// RUAN MARCELO RAMACIOTI LUZ
import { storeConfig } from "@/config/store";
import type { listPublishedProducts } from "@/features/products/repository";
import { ProductTile } from "@/components/product-tile";
import { toFavoriteProduct } from "@/features/favorites/service";

type Product = Awaited<ReturnType<typeof listPublishedProducts>>["items"][number];

export function ProductCard({ product }: { product: Product }) {
  return <ProductTile product={toFavoriteProduct(product, storeConfig.showPrices)} whatsappConfigured={Boolean(storeConfig.whatsappNumber)} />;
}
