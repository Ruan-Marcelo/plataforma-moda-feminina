// RUAN MARCELO RAMACIOTI LUZ
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { ProductVariantSelector } from "@/components/product-variant-selector";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VirtualTryOnUpload } from "@/components/virtual-try-on-upload";
import { storeConfig } from "@/config/store";
import { findPublishedProductBySlug, listRelatedPublishedProducts } from "@/features/products/repository";
import { env } from "@/lib/env";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = env.DATABASE_URL ? await findPublishedProductBySlug(slug).catch(() => null) : null;
  if (!product) return { title: "Produto não encontrado" };
  return { title: product.name, description: product.description ?? "Produto da coleção." };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = env.DATABASE_URL ? await findPublishedProductBySlug(slug).catch(() => null) : null;
  if (!product) notFound();
  const related = await listRelatedPublishedProducts(product.id, product.categoryId, product.collectionId);
  const productUrl = `${storeConfig.appUrl}/produto/${product.slug}`;
  const variantData = product.variants.map((variant) => ({ id: variant.id, size: variant.size, color: variant.color, colorHex: variant.colorHex, available: variant.available }));

  return <main className="min-h-screen bg-cream text-ink"><SiteHeader /><div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16"><p className="text-xs uppercase tracking-[0.25em] text-wine">{product.category?.name ?? "Produto"}</p><div className="mt-5 grid gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] md:gap-14"><ProductGallery images={product.images} productName={product.name} /><section><h1 className="font-display text-5xl leading-tight text-wine md:text-6xl">{product.name}</h1><p className="mt-2 text-xs text-muted">Ref.: {product.slug}</p>{product.description ? <p className="mt-6 whitespace-pre-line leading-7 text-muted">{product.description}</p> : <p className="mt-6 text-sm text-muted">Descrição não cadastrada.</p>}{product.priceCents !== null ? <p className="mt-7 text-xl" aria-label="Preço">R$ {(product.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p> : <p className="mt-7 text-sm text-muted">Preço sob consulta</p>}<ProductVariantSelector productName={product.name} productUrl={productUrl} whatsappNumber={storeConfig.whatsappNumber} variants={variantData} /><div id="provador" className="scroll-mt-6"><VirtualTryOnUpload productId={product.id} /></div></section></div>{related.length ? <section className="mt-20 border-t border-nude pt-12" aria-labelledby="related-title"><h2 id="related-title" className="font-display text-4xl text-wine">Você também pode gostar</h2><ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6" aria-label="Produtos relacionados">{related.map((item) => <ProductCard key={item.id} product={item} />)}</ul></section> : null}</div><SiteFooter /></main>;
}
