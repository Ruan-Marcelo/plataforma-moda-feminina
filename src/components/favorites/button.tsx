"use client";
import { useFavorites } from "./provider";
export function FavoriteButton({ productId, productName }: { productId: string; productName: string }) {
  const { ids, ready, toggle } = useFavorites();
  const selected = ids.includes(productId);
  return <button type="button" disabled={!ready} aria-pressed={selected} aria-label={`${selected ? "Remover dos" : "Adicionar aos"} favoritos: ${productName}`} onClick={() => toggle(productId)} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border px-3 py-3 text-sm disabled:opacity-50 ${selected ? "border-wine bg-wine text-white" : "border-nude bg-white text-wine hover:border-wine"}`}><span aria-hidden="true">{selected ? "♥" : "♡"}</span>{selected ? "Salvo nos favoritos" : "Salvar nos favoritos"}</button>;
}
