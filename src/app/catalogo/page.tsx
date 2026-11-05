// RUAN MARCELO RAMACIOTI LUZ
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { storeConfig } from "@/config/store";
import { listPublishedCategories, listPublishedProducts } from "@/features/products/repository";
import { catalogQuerySchema, type CatalogQuery } from "@/features/products/validation";
import { env } from "@/lib/env";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function queryString(query: Partial<CatalogQuery>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "" && !(key === "availability" && value === "all")) params.set(key, String(value));
  }
  return params.toString();
}

export default async function CatalogPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const raw = searchParams ? await searchParams : {};
  const parsed = catalogQuerySchema.safeParse(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, firstValue(value)])));
  const query = parsed.success ? parsed.data : catalogQuerySchema.parse({});
  let result: Awaited<ReturnType<typeof listPublishedProducts>> | null = null;
  let categories: Awaited<ReturnType<typeof listPublishedCategories>> = [];
  let databaseUnavailable = false;

  if (env.DATABASE_URL) {
    const [productsResponse, categoriesResponse] = await Promise.allSettled([listPublishedProducts(query), listPublishedCategories()]);
    if (productsResponse.status === "fulfilled") result = productsResponse.value;
    else databaseUnavailable = true;
    if (categoriesResponse.status === "fulfilled") categories = categoriesResponse.value;
  } else databaseUnavailable = true;

  const hasPreviousPage = Boolean(result && result.page > 1);
  const hasNextPage = Boolean(result && result.page < result.pageCount);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
        <Link href="/" className="rounded text-sm text-wine underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine">← Voltar para {storeConfig.name}</Link>
        <p className="mt-12 text-xs uppercase tracking-[0.3em] text-wine">Catálogo</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-5xl text-wine md:text-7xl">Peças selecionadas</h1><p className="mt-4 max-w-xl text-muted">Encontre uma peça por nome, categoria, tamanho, cor ou disponibilidade.</p></div>{result ? <p className="text-sm text-muted" aria-live="polite">{result.total} {result.total === 1 ? "resultado" : "resultados"}</p> : null}</div>
        <form className="mt-8 grid gap-3 rounded-belin-lg border border-nude bg-white p-4 sm:grid-cols-2 lg:grid-cols-5" method="get" aria-label="Filtros do catálogo">
          <label className="text-sm lg:col-span-2">Buscar por nome<input className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude px-3" name="q" defaultValue={query.q} placeholder="Ex.: vestido" /></label>
          <label className="text-sm">Categoria<select className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude bg-white px-3" name="categoryId" defaultValue={query.categoryId ?? ""}><option value="">Todas</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-sm">Tamanho<input className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude px-3" name="size" defaultValue={query.size} placeholder="Ex.: M" /></label>
          <label className="text-sm">Cor<input className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude px-3" name="color" defaultValue={query.color} placeholder="Ex.: Bordô" /></label>
          <label className="text-sm">Disponibilidade<select className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude bg-white px-3" name="availability" defaultValue={query.availability}><option value="all">Todas</option><option value="available">Disponíveis</option><option value="unavailable">Indisponíveis</option></select></label>
          <label className="text-sm">Ordenar<select className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude bg-white px-3" name="sort" defaultValue={query.sort}><option value="newest">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option></select></label>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-5"><button className="min-h-11 rounded-full bg-wine px-5 text-sm text-white transition-colors hover:bg-wine-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine" type="submit">Aplicar filtros</button><Link href="/catalogo" className="inline-flex min-h-11 items-center rounded-full border border-wine px-5 text-sm text-wine hover:bg-nude focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine">Limpar</Link></div>
        </form>
        {databaseUnavailable ? <p className="mt-8 rounded-belin-md border border-nude bg-white p-5 text-muted" role="status">O catálogo está temporariamente indisponível. Tente novamente mais tarde.</p> : result && result.items.length > 0 ? <>
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4" aria-label="Produtos publicados">{result.items.map((product) => <ProductCard key={product.id} product={product} />)}</ul>
          {result.pageCount > 1 ? <nav className="mt-10 flex items-center justify-center gap-5" aria-label="Paginação do catálogo"><span className="text-sm text-muted">Página {result.page} de {result.pageCount}</span>{hasPreviousPage ? <Link className="rounded-full border border-wine px-4 py-2 text-sm text-wine hover:bg-nude focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine" href={`/catalogo?${queryString({ ...query, page: result.page - 1 })}`}>Anterior</Link> : null}{hasNextPage ? <Link className="rounded-full border border-wine px-4 py-2 text-sm text-wine hover:bg-nude focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine" href={`/catalogo?${queryString({ ...query, page: result.page + 1 })}`}>Próxima</Link> : null}</nav> : null}
        </> : <div className="mt-10 rounded-belin-lg border border-dashed border-nude bg-white p-10 text-center" role="status"><p className="font-display text-3xl text-wine">Nenhuma peça encontrada</p><p className="mt-3 text-sm text-muted">Tente remover algum filtro ou faça uma nova busca.</p><Link href="/catalogo" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-wine px-5 text-sm text-white">Ver todo o catálogo</Link></div>}
      </div>
      <SiteFooter />
    </main>
  );
}
