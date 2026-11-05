import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { ProductVariantSelector } from "@/components/product-variant-selector";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { storeConfig } from "@/config/store";
import { findPublishedProductBySlug, listRelatedPublishedProducts } from "@/features/products/repository";
import { env } from "@/lib/env";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ selection?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = env.DATABASE_URL ? await findPublishedProductBySlug(slug).catch(() => null) : null;
  if (!product) return { title: "Produto não encontrado" };
  return { title: product.name, description: product.description ?? "Conheça os detalhes desta peça BÉLIN." };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const product = env.DATABASE_URL ? await findPublishedProductBySlug(slug).catch(() => null) : null;
  if (!product) notFound();
  const related = await listRelatedPublishedProducts(product.id, product.categoryId, product.collectionId).catch(() => []);
  const staleSelection = (await searchParams).selection === "unavailable";
  const variantData = product.variants.map(({ id, size, color, colorHex, available }) => ({ id, size, color, colorHex, available }));

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:py-10">
        <nav aria-label="Caminho da página" className="mb-6 flex min-w-0 flex-wrap items-center gap-2 text-xs leading-6 text-muted">
          <Link href="/catalogo" className="inline-flex min-h-11 items-center rounded underline-offset-4 hover:underline">Catálogo</Link><span aria-hidden="true">/</span><span className="min-w-0 break-words" aria-current="page">{product.name}</span>
        </nav>
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-14">
          <div className="min-w-0 lg:sticky lg:top-6"><ProductGallery key={product.id} images={product.images.map(({ id, url, alt }) => ({ id, url, alt }))} productName={product.name} /></div>
          <section className="min-w-0" aria-labelledby="product-title">
            <p className="text-xs uppercase tracking-[0.2em] text-wine">{product.category?.name ?? "Curadoria BÉLIN"}</p>
            <h1 id="product-title" className="mt-3 break-words font-display text-4xl leading-tight text-wine sm:text-5xl lg:text-6xl">{product.name}</h1>
            <p className="mt-3 break-all text-xs text-muted">Referência: {product.slug}</p>
            {storeConfig.showPrices && product.priceCents !== null ? <p className="mt-6 text-2xl font-medium text-wine" aria-label="Preço">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.priceCents / 100)}</p> : <p className="mt-6 text-sm text-muted">Preço sob consulta</p>}
            {staleSelection ? <p className="mt-5 rounded-belin-md border border-wine bg-white p-4 text-sm text-wine" role="alert">A combinação escolhida não está mais disponível. Confira as opções atualizadas abaixo.</p> : null}
            <ProductVariantSelector key={product.id} productId={product.id} whatsappConfigured={Boolean(storeConfig.whatsappNumber)} variants={variantData} />
            <section className="mt-8 border-t border-nude pt-7" aria-labelledby="description-title">
              <h2 id="description-title" className="font-display text-2xl text-wine">Sobre a peça</h2>
              <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-muted">{product.description || "A descrição completa desta peça ainda não foi cadastrada."}</p>
            </section>
          </section>
        </div>
        {related.length ? <section className="mt-14 border-t border-nude pt-10 lg:mt-20" aria-labelledby="related-title"><p className="text-xs uppercase tracking-[0.2em] text-wine">Continue explorando</p><h2 id="related-title" className="mt-3 font-display text-3xl text-wine sm:text-4xl">Você também pode gostar</h2><ul className="mt-7 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4 md:gap-6" aria-label="Produtos relacionados">{related.map(item => <ProductCard key={item.id} product={item} />)}</ul></section> : null}
      </div>
      <SiteFooter />
    </main>
  );
}
