// RUAN MARCELO RAMACIOTI LUZ
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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

  const activeFilters = [query.categoryId, query.size, query.color, query.availability !== "all", query.sort !== "newest"].filter(Boolean).length;

  const hasPreviousPage = Boolean(result && result.page > 1);
  const hasNextPage = Boolean(result && result.page < result.pageCount);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <div id="page-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-12">
        <div className="flex items-end justify-between gap-3"><h1 className="font-display text-3xl text-wine md:text-5xl">Peças selecionadas</h1>{result ? <p className="shrink-0 text-xs text-muted" aria-live="polite">{result.total} {result.total === 1 ? "peça" : "peças"}</p> : null}</div>
        <form className="mt-5" method="get" aria-label="Filtros do catálogo">
          <div className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Buscar por nome</span><input className="block min-h-12 w-full rounded-full border border-nude bg-white px-4 text-base" name="q" defaultValue={query.q} placeholder="Buscar uma peça" /></label><button className="min-h-12 rounded-full bg-wine px-5 text-sm text-white" type="submit">Buscar</button></div>
          <details className="mt-3 rounded-belin-md border border-nude bg-white">
            <summary className="min-h-12 cursor-pointer rounded-belin-md px-4 py-3 text-sm text-wine focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine">Filtros e ordenação{activeFilters > 0 ? ` (${activeFilters} ativos)` : ""}</summary>
            <div className="grid gap-4 border-t border-nude p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">Categoria<select className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude bg-white px-3" name="categoryId" defaultValue={query.categoryId ?? ""}><option value="">Todas</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-sm">Tamanho<input className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude px-3" name="size" defaultValue={query.size} placeholder="Ex.: M" /></label>
          <label className="text-sm">Cor<input className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude px-3" name="color" defaultValue={query.color} placeholder="Ex.: Bordô" /></label>
          <label className="text-sm">Disponibilidade<select className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude bg-white px-3" name="availability" defaultValue={query.availability}><option value="all">Todas</option><option value="available">Disponíveis</option><option value="unavailable">Indisponíveis</option></select></label>
          <label className="text-sm">Ordenar<select className="mt-1 block min-h-11 w-full rounded-belin-md border border-nude bg-white px-3" name="sort" defaultValue={query.sort}><option value="newest">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option></select></label>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3"><button className="min-h-11 rounded-full bg-wine px-5 text-sm text-white transition-colors hover:bg-wine-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine" type="submit">Aplicar filtros</button><Link href="/catalogo" className="inline-flex min-h-11 items-center rounded-full border border-wine px-5 text-sm text-wine hover:bg-nude focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine">Limpar</Link></div>
            </div>
          </details>
          {activeFilters > 0 || query.q ? <Link href="/catalogo" className="mt-1 inline-flex min-h-11 items-center text-sm text-wine underline">Limpar busca e filtros</Link> : null}
        </form>
        {databaseUnavailable ? <p className="mt-8 rounded-belin-md border border-nude bg-white p-5 text-muted" role="status">O catálogo está temporariamente indisponível. Tente novamente mais tarde.</p> : result && result.items.length > 0 ? <>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4" aria-label="Produtos publicados">{result.items.map((product) => <ProductCard key={product.id} product={product} />)}</ul>
          {result.pageCount > 1 ? <nav className="mt-10 flex items-center justify-center gap-5" aria-label="Paginação do catálogo"><span className="text-sm text-muted">Página {result.page} de {result.pageCount}</span>{hasPreviousPage ? <Link className="rounded-full border border-wine px-4 py-2 text-sm text-wine hover:bg-nude focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine" href={`/catalogo?${queryString({ ...query, page: result.page - 1 })}`}>Anterior</Link> : null}{hasNextPage ? <Link className="rounded-full border border-wine px-4 py-2 text-sm text-wine hover:bg-nude focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine" href={`/catalogo?${queryString({ ...query, page: result.page + 1 })}`}>Próxima</Link> : null}</nav> : null}
        </> : <div className="mt-10 rounded-belin-lg border border-dashed border-nude bg-white p-10 text-center" role="status"><p className="font-display text-3xl text-wine">Nenhuma peça encontrada</p><p className="mt-3 text-sm text-muted">Tente remover algum filtro ou faça uma nova busca.</p><Link href="/catalogo" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-wine px-5 text-sm text-white">Ver todo o catálogo</Link></div>}
      </div>
      <SiteFooter />
    </main>
  );
}
