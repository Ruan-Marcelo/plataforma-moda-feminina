import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VirtualFittingExperience } from "@/components/virtual-fitting/experience";
import { findPublishedProductById, listPublishedProducts } from "@/features/products/repository";
import { findAvailableVariant, productSelectionSchema } from "@/features/products/selection";
import type { FittingProduct } from "@/features/virtual-fitting/contracts";
import { storeConfig } from "@/config/store";
import { env } from "@/lib/env";

export const metadata = { title: "Provador virtual", description: "Escolha uma peça e prepare sua fotografia para uma simulação visual BÉLIN." };
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function VirtualFittingPage({ searchParams }: Props) {
  const query = await searchParams;
  const hasSelection = query.productId !== undefined || query.variantId !== undefined;
  const parsed = productSelectionSchema.safeParse(query);
  const [product, catalog] = await Promise.all([
    parsed.success && env.DATABASE_URL ? findPublishedProductById(parsed.data.productId).catch(() => null) : null,
    env.DATABASE_URL ? listPublishedProducts({ availability: "available", pageSize: 24 }).catch(() => null) : null,
  ]);
  const variant = product && parsed.success ? findAvailableVariant(product.variants, parsed.data.variantId) : null;
  const initialSelection = product && variant ? { productId: product.id, variantId: variant.id } : null;
  const source = catalog?.items ?? [];
  const items = product && variant && !source.some(item => item.id === product.id) ? [product, ...source] : source;
  const products: FittingProduct[] = items.map(item => ({
    id: item.id, name: item.name, slug: item.slug,
    image: item.images[0] ? { url: item.images[0].url, alt: item.images[0].alt } : null,
    variants: item.variants.map(({ id, color, colorHex, size, available }) => ({ id, color, colorHex, size, available })),
  }));
  return <main className="min-h-screen bg-cream text-ink"><SiteHeader /><VirtualFittingExperience
    key={initialSelection ? `${initialSelection.productId}:${initialSelection.variantId}` : "unselected"}
    products={products}
    initialSelection={initialSelection}
    selectionError={hasSelection && !initialSelection}
    catalogUnavailable={!catalog}
    serviceAvailable={Boolean(env.VIRTUAL_FITTING_ENABLED && env.FASHN_API_KEY)}
    whatsappConfigured={Boolean(storeConfig.whatsappNumber)}
  /><SiteFooter /></main>;
}
