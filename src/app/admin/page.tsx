// RUAN MARCELO RAMACIOTI LUZ
import { notFound, redirect } from "next/navigation";
import { auth } from "@/../auth";
import { AdminProductManager, type AdminProduct } from "@/components/admin-product-manager";
import { AdminTaxonomyManager } from "@/components/admin-taxonomy-manager";
import { getAdminAnalyticsSummary, type AdminAnalyticsSummary } from "@/features/analytics/admin-repository";
import { listAdminProducts, listAdminTaxonomy } from "@/features/products/repository";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-nude bg-cream p-4"><dt className="text-xs uppercase tracking-[0.16em] text-stone-600">{label}</dt><dd className="mt-2 font-display text-3xl text-wine">{value.toLocaleString("pt-BR")}</dd></div>;
}

type Taxonomy = Awaited<ReturnType<typeof listAdminTaxonomy>>;

function AnalyticsPanel({ summary }: { summary: AdminAnalyticsSummary | null }) {
  if (!summary) return <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><h2 className="font-semibold">Analytics indisponível</h2><p className="mt-2">Não foi possível consultar eventos registrados. Nenhum número foi preenchido artificialmente.</p></section>;
  return <section className="mt-8 rounded-2xl border border-nude bg-white p-5 md:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-wine">Dados registrados</p><h2 className="mt-2 font-display text-3xl text-wine">Resumo dos últimos {summary.days} dias</h2></div><div className="text-right"><p className="text-xs text-stone-500">Desde {new Date(summary.since).toLocaleDateString("pt-BR")}</p><nav className="mt-2 flex flex-wrap justify-end gap-2" aria-label="Período das métricas">{[7, 30, 90].map((days) => <a className={`rounded-full border px-3 py-1 text-xs ${days === summary.days ? "border-wine bg-wine text-white" : "border-nude text-wine"}`} href={`/admin?days=${days}`} key={days}>{days} dias</a>)}<a className="rounded-full border border-nude px-3 py-1 text-xs text-wine" href={`/api/admin/analytics/export?days=${summary.days}`}>CSV</a></nav></div></div><dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Eventos" value={summary.totalEvents} /><Metric label="Visitas" value={summary.pageViews} /><Metric label="Visitantes estimados" value={summary.uniqueVisitors} /><Metric label="Visualizações de peças" value={summary.productViews} /><Metric label="Cliques WhatsApp" value={summary.whatsappClicks} /><Metric label="Provador iniciado" value={summary.tryOnStarted} /><Metric label="Provador concluído" value={summary.tryOnCompleted} /></dl><p className="mt-5 text-xs text-stone-500">Visitantes são estimados por identificadores anônimos com consentimento. O resumo não representa conversão de vendas.</p></section>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") notFound();

  const requestedDays = Number((await searchParams).days);
  const days: 7 | 30 | 90 = requestedDays === 30 || requestedDays === 90 ? requestedDays : 7;
  let products: Awaited<ReturnType<typeof listAdminProducts>> = [];
  let analytics: AdminAnalyticsSummary | null = null;
  let taxonomy: Taxonomy = { categories: [], collections: [] };
  let databaseError = false;
  if (env.DATABASE_URL) {
    const [productsResult, analyticsResult, taxonomyResult] = await Promise.allSettled([listAdminProducts(), getAdminAnalyticsSummary(days), listAdminTaxonomy()]);
    if (productsResult.status === "fulfilled") products = productsResult.value;
    else databaseError = true;
    if (analyticsResult.status === "fulfilled") analytics = analyticsResult.value;
    if (taxonomyResult.status === "fulfilled") taxonomy = taxonomyResult.value;
  } else databaseError = true;
  const initialProducts: AdminProduct[] = products.map((product) => ({ id: product.id, name: product.name, slug: product.slug, description: product.description, status: product.status, priceCents: product.priceCents, categoryId: product.categoryId, collectionId: product.collectionId, variants: product.variants.map((variant) => ({ size: variant.size, color: variant.color, colorHex: variant.colorHex, available: variant.available })), variantCount: product.variants.length, imageCount: product.images.length, updatedAt: product.updatedAt.toISOString() }));

  return <main className="min-h-screen bg-cream px-5 py-12 md:px-8 md:py-16"><div className="mx-auto max-w-7xl"><p className="text-xs uppercase tracking-[0.3em] text-wine">Administração</p><h1 className="mt-4 font-display text-5xl text-wine md:text-7xl">Painel da loja</h1><p className="mt-5 text-stone-600">Sessão autenticada como {session.user.email ?? "usuário"} ({session.user.role}).</p><AnalyticsPanel summary={analytics} />{databaseError ? <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Não foi possível consultar o banco agora. Verifique DATABASE_URL e as migrations.</section> : <><AdminTaxonomyManager initialCategories={taxonomy.categories} initialCollections={taxonomy.collections} /><section className="mt-10 rounded-2xl border border-nude bg-white p-5 md:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-3xl text-wine">Catálogo</h2><p className="mt-2 text-sm text-stone-600">Produtos carregados diretamente do banco. Nenhuma métrica ou disponibilidade é inventada.</p></div><span className="rounded-full bg-wine px-3 py-1 text-xs font-medium text-white">Gestão protegida</span></div><AdminProductManager initialProducts={initialProducts} initialCategories={taxonomy.categories} initialCollections={taxonomy.collections} /></section></>}</div></main>;
}
