// RUAN MARCELO RAMACIOTI LUZ
import Image from "next/image";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { storeConfig } from "@/config/store";
import { listPublishedProducts } from "@/features/products/repository";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = env.DATABASE_URL ? await listPublishedProducts({ pageSize: 4, sort: "newest" }).catch(() => null) : null;
  const products = result?.items ?? [];

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <section id="page-content" tabIndex={-1} className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-12 md:px-8 md:pb-24 md:pt-16" aria-labelledby="hero-title">
        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.3em] text-wine">Moda feminina · presença e intenção</p>
          <h1 id="hero-title" className="max-w-3xl font-display text-6xl leading-[0.9] text-wine md:text-8xl">Você é essência, exale.</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted">Uma curadoria {storeConfig.name} para vestir os seus dias com elegância, conforto e personalidade.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/catalogo" className={buttonClassName()}>Explorar catálogo</Link><Link href="/provador" className={buttonClassName("secondary")}>Experimentar com IA</Link></div>
        </div>
        <div className="relative overflow-hidden rounded-belin-lg border border-wine bg-wine shadow-belin-soft">
          <Image src="/brand/belin-editorial.jpeg" alt="Identidade visual BÉLIN em composição editorial bordô e creme" width={1063} height={1181} sizes="(min-width: 1280px) 560px, (min-width: 768px) 45vw, 100vw" className="h-[25rem] w-full object-cover md:h-[34rem]" priority />
          <div className="absolute inset-x-0 bottom-0 bg-wine/90 p-6 text-cream md:p-8"><p className="font-display text-3xl leading-tight md:text-4xl">Vista o que revela quem você é.</p></div>
        </div>
      </section>

      <section className="border-y border-nude bg-white px-5 py-14 md:px-8 md:py-20" aria-labelledby="new-arrivals-title">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.3em] text-wine">Curadoria BÉLIN</p><h2 id="new-arrivals-title" className="mt-3 font-display text-4xl text-wine md:text-5xl">Novidades</h2></div><Link href="/catalogo" className="rounded px-1 text-sm text-wine underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine">Ver catálogo</Link></div>
          {products.length ? <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6" aria-label="Novidades publicadas">{products.map((product) => <ProductCard key={product.id} product={product} />)}</ul> : <Card className="mt-8 border-dashed p-8 text-center"><p className="font-display text-2xl text-wine">Novidades em breve</p><p className="mt-2 text-sm text-muted">As peças aparecerão aqui quando forem publicadas no catálogo.</p></Card>}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 md:grid-cols-2 md:px-8 md:py-20" aria-labelledby="try-on-title">
        <div><p className="text-xs uppercase tracking-[0.3em] text-wine">Uma nova forma de escolher</p><h2 id="try-on-title" className="mt-3 font-display text-4xl text-wine md:text-5xl">Experimente antes de conversar.</h2><p className="mt-5 max-w-lg leading-7 text-muted">Envie uma fotografia e veja uma simulação visual da peça. O resultado é ilustrativo e não garante tamanho, caimento ou aparência física exata.</p><Link href="/provador" className={buttonClassName("secondary", "mt-7")}>Conhecer o provador virtual</Link></div>
        <Card className="flex min-h-56 items-end bg-wine p-7 text-cream md:min-h-72 md:p-9"><p className="max-w-sm font-display text-3xl leading-tight">A sua próxima peça favorita começa com uma conversa.</p></Card>
      </section>
      <SiteFooter />
    </main>
  );
}
