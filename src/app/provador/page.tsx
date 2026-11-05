import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { findPublishedProductById } from "@/features/products/repository";
import { findAvailableVariant, productSelectionSchema } from "@/features/products/selection";
import { env } from "@/lib/env";

export const metadata = { title: "Provador virtual", description: "Confira a peça e a variante selecionadas para o provador BÉLIN." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function VirtualFittingPage({ searchParams }: Props) {
  const query = await searchParams;
  const hasSelection = query.productId !== undefined || query.variantId !== undefined;
  const parsed = productSelectionSchema.safeParse(query);
  const product = parsed.success && env.DATABASE_URL ? await findPublishedProductById(parsed.data.productId).catch(() => null) : null;
  const variant = product && parsed.success ? findAvailableVariant(product.variants, parsed.data.variantId) : null;
  const valid = Boolean(product && variant);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-14">
        <Link href={product ? `/produto/${product.slug}` : "/catalogo"} className="inline-flex min-h-11 items-center rounded text-sm text-wine">← {product ? "Voltar para a peça" : "Voltar ao catálogo"}</Link>
        <p className="mt-8 text-xs uppercase tracking-[0.25em] text-wine">Provador virtual</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-wine sm:text-5xl">Sua escolha, em detalhes.</h1>
        <p className="mt-5 text-sm leading-7 text-muted">Confira a peça escolhida para a futura experiência de experimentação.</p>
        {hasSelection && !valid ? <section className="mt-8 rounded-belin-lg border border-wine bg-white p-6" role="alert"><h2 className="font-display text-2xl text-wine">Seleção indisponível</h2><p className="mt-3 text-sm leading-6 text-muted">A peça ou a combinação de cor e tamanho não está disponível. Volte e escolha uma variante válida.</p></section> : null}
        {valid && product && variant ? <section className="mt-8 flex min-w-0 flex-col gap-5 rounded-belin-lg border border-nude bg-white p-5 sm:flex-row sm:p-7" aria-label="Peça selecionada">
          {product.images[0] ? <Image src={product.images[0].url} alt={product.images[0].alt || product.name} width={160} height={200} unoptimized className="aspect-[4/5] w-32 shrink-0 self-start rounded-belin-md bg-nude object-contain" /> : null}
          <div className="min-w-0"><h2 className="break-words font-display text-3xl text-wine">{product.name}</h2><p className="mt-2 break-all text-xs text-muted">Referência: {product.slug}</p><dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm"><dt className="text-muted">Cor</dt><dd className="break-words">{variant.color}</dd><dt className="text-muted">Tamanho</dt><dd className="break-words">{variant.size}</dd></dl><p className="mt-4 text-sm text-success">Combinação disponível</p></div>
        </section> : null}
        <section className="mt-8 rounded-belin-lg border border-nude bg-white p-6 sm:p-8" aria-labelledby="fitting-status-title">
          <h2 id="fitting-status-title" className="font-display text-2xl text-wine">Experimentação em preparação</h2>
          <p className="mt-4 text-sm leading-7 text-muted">Nesta etapa, o fluxo apenas guarda sua escolha na navegação. O envio de fotografias e a geração de simulações ainda não estão habilitados aqui.</p>
          <Link href={valid && product ? `/produto/${product.slug}` : "/catalogo"} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-wine px-6 py-3 text-center text-sm text-white hover:bg-wine-dark">{valid ? "Rever cor e tamanho" : "Escolher uma peça"}</Link>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
