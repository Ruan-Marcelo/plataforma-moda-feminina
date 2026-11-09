"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { favoritesResponseSchema, type FavoriteProduct } from "@/features/favorites/contracts";
import { useFavorites } from "./provider";
import { FavoriteButton } from "./button";
import { ProductTile } from "@/components/product-tile";
export function FavoritesList({ whatsappConfigured }: { whatsappConfigured: boolean }) {
  const { ids, ready, clear } = useFavorites();
  const [data, setData] = useState<{ key: string; products: FavoriteProduct[]; missingIds: string[] } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify(ids);
  useEffect(() => {
    if (!ready || key === "[]") return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let active = true;
    setError("");
    void fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: key, signal: controller.signal, cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error();
      const parsed = favoritesResponseSchema.parse(await response.json());
      if (active) setData({ key, ...parsed });
    }).catch(() => { if (active) setError("Não foi possível consultar as peças agora. Seus favoritos foram preservados."); }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [key, ready, retry]);
  if (!ready) return <p role="status">Carregando favoritos…</p>;
  if (!ids.length) return <div className="mt-8 rounded-belin-lg border border-nude bg-white p-6"><p>Você ainda não salvou peças.</p><Link href="/catalogo" className="mt-4 inline-flex min-h-12 items-center text-wine underline">Explorar o catálogo</Link></div>;
  return <section className="mt-8" aria-label="Suas peças favoritas"><div className="flex flex-wrap items-center justify-between gap-3"><p>{ids.length} {ids.length === 1 ? "peça salva" : "peças salvas"}</p><button type="button" className="min-h-12 rounded-full border border-nude px-5 text-sm text-wine" onClick={clear}>Limpar favoritos</button></div>{error ? <div role="alert" className="mt-5"><p>{error}</p><button type="button" className="min-h-12 underline" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div> : data?.key !== key ? <p role="status" className="mt-6">Consultando disponibilidade…</p> : <><ul className="mt-6 grid min-w-0 grid-cols-1 gap-4 min-[360px]:grid-cols-2 lg:grid-cols-4" aria-label="Favoritos disponíveis no catálogo">{data.products.map(product => <ProductTile key={product.id} product={product} whatsappConfigured={whatsappConfigured} />)}</ul>{data.missingIds.length ? <section className="mt-8 rounded-belin-lg border border-nude p-5" aria-label="Peças fora do catálogo"><h2 className="font-display text-2xl text-wine">Peças fora do catálogo</h2><p className="mt-2 text-sm text-muted">Estas peças foram removidas ou deixaram de ser publicadas. Você pode retirá-las dos favoritos.</p><ul className="mt-4 grid gap-4 sm:grid-cols-2">{data.missingIds.map(id => <li key={id} className="min-w-0"><p className="mb-2 break-all text-xs text-muted">Identificação: {id}</p><FavoriteButton productId={id} productName="Peça fora do catálogo" /></li>)}</ul></section> : null}</>}</section>;
}
