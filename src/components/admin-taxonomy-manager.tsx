// RUAN MARCELO RAMACIOTI LUZ
"use client";

import { useState } from "react";

export type TaxonomyItem = { id: string; name: string; slug: string; description?: string | null };
type Props = { initialCategories: TaxonomyItem[]; initialCollections: TaxonomyItem[] };

export function AdminTaxonomyManager({ initialCategories, initialCollections }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [collections, setCollections] = useState(initialCollections);
  const [kind, setKind] = useState<"category" | "collection">("category");
  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [description, setDescription] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/taxonomy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, name, slug, description: description || undefined }) });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || typeof data !== "object" || data === null || !("item" in data)) throw new Error("create_failed");
      const item = (data as { item: TaxonomyItem }).item;
      if (kind === "category") setCategories((current) => [...current, item].sort((a, b) => a.name.localeCompare(b.name))); else setCollections((current) => [...current, item].sort((a, b) => a.name.localeCompare(b.name)));
      setName(""); setSlug(""); setDescription(""); setMessage("Cadastro criado.");
    } catch { setMessage("Não foi possível criar. Verifique o slug e tente novamente."); } finally { setBusy(false); }
  }
  async function remove(kindToRemove: "category" | "collection", item: TaxonomyItem) {
    if (!window.confirm(`Excluir ${kindToRemove === "category" ? "a categoria" : "a coleção"} “${item.name}”? Produtos serão apenas desvinculados.`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/taxonomy/${kindToRemove}/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete_failed");
      if (kindToRemove === "category") setCategories((current) => current.filter((entry) => entry.id !== item.id)); else setCollections((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("Cadastro excluído.");
    } catch { setMessage("Não foi possível excluir o cadastro."); } finally { setBusy(false); }
  }
  return <section className="mt-8 rounded-2xl border border-nude bg-white p-5 md:p-8"><h2 className="font-display text-3xl text-wine">Categorias e coleções</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm">Tipo<select className="mt-1 min-h-11 w-full rounded border border-nude px-3" value={kind} onChange={(event) => setKind(event.target.value as "category" | "collection")}><option value="category">Categoria</option><option value="collection">Coleção</option></select></label><label className="text-sm">Nome<input className="mt-1 min-h-11 w-full rounded border border-nude px-3" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></label><label className="text-sm">Slug<input className="mt-1 min-h-11 w-full rounded border border-nude px-3" value={slug} onChange={(event) => setSlug(event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={160} /></label><button className="min-h-11 self-end rounded-full bg-wine px-4 text-sm text-white disabled:opacity-50" type="button" onClick={() => void create()} disabled={busy || !name || !slug}>Cadastrar</button></div>{kind === "collection" ? <label className="mt-3 block max-w-xl text-sm">Descrição<textarea className="mt-1 min-h-20 w-full rounded border border-nude px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} /></label> : null}<div className="mt-5 grid gap-4 sm:grid-cols-2"><div><h3 className="text-sm font-semibold">Categorias cadastradas</h3>{categories.length ? <ul className="mt-2 space-y-1 text-sm text-stone-600">{categories.map((item) => <li className="flex items-center justify-between gap-2" key={item.id}><span>{item.name}</span><button className="text-xs text-red-800 underline" type="button" onClick={() => void remove("category", item)} disabled={busy}>Excluir</button></li>)}</ul> : <p className="mt-2 text-sm text-stone-600">Nenhuma</p>}</div><div><h3 className="text-sm font-semibold">Coleções cadastradas</h3>{collections.length ? <ul className="mt-2 space-y-1 text-sm text-stone-600">{collections.map((item) => <li className="flex items-center justify-between gap-2" key={item.id}><span>{item.name}</span><button className="text-xs text-red-800 underline" type="button" onClick={() => void remove("collection", item)} disabled={busy}>Excluir</button></li>)}</ul> : <p className="mt-2 text-sm text-stone-600">Nenhuma</p>}</div></div><p className="mt-3 text-xs text-stone-600" aria-live="polite">{message}</p></section>;
}
