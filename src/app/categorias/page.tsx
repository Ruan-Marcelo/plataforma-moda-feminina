// RUAN MARCELO RAMACIOTI LUZ
import Link from "next/link";
import { listPublishedCategories } from "@/features/products/repository";
import { env } from "@/lib/env";

export const metadata = { title: "Categorias", description: "Explore as categorias de moda feminina da BÉLIN." };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let categories = null;
  let databaseUnavailable = false;
  if (env.DATABASE_URL) {
    try { categories = await listPublishedCategories(); } catch { databaseUnavailable = true; }
  } else databaseUnavailable = true;
  return <main className="min-h-screen bg-cream px-5 py-12 md:px-8 md:py-16"><div className="mx-auto max-w-7xl"><Link href="/" className="text-sm text-wine">← Voltar para BÉLIN</Link><p className="mt-14 text-xs uppercase tracking-[0.3em] text-wine">Categorias</p><h1 className="mt-4 font-display text-5xl text-wine md:text-7xl">Encontre o seu estilo</h1>{databaseUnavailable ? <p className="mt-8 rounded border border-nude bg-white p-5 text-stone-600">As categorias estão temporariamente indisponíveis.</p> : categories?.length ? <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">{categories.map((category) => <li key={category.id}><Link href={`/catalogo?categoryId=${category.id}`} className="flex min-h-36 flex-col justify-between rounded-2xl border border-nude bg-white p-5 transition-colors hover:bg-nude"><span className="font-display text-2xl text-wine">{category.name}</span><span className="text-sm text-stone-600">{category._count.products} {category._count.products === 1 ? "peça publicada" : "peças publicadas"}</span></Link></li>)}</ul> : <p className="mt-8 rounded border border-dashed border-nude bg-white p-8 text-center text-stone-600">Nenhuma categoria com produtos publicados.</p>}<Link href="/catalogo" className="mt-10 inline-flex min-h-11 items-center rounded-full bg-wine px-5 text-sm text-white">Ver todo o catálogo</Link></div></main>;
}
