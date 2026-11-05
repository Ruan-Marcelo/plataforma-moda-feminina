"use client";

import Image from "next/image";
import Link from "next/link";
import { getVariantSizes, selectVariantForColor } from "@/features/products/selection";
import type { FittingProduct, FittingSelection } from "@/features/virtual-fitting/contracts";

type Props = { products: FittingProduct[]; selection: FittingSelection | null; onSelect: (selection: FittingSelection | null) => void };

export function GarmentPicker({ products, selection, onSelect }: Props) {
  const product = products.find(item => item.id === selection?.productId);
  const variant = product?.variants.find(item => item.id === selection?.variantId && item.available);
  const colors = [...new Set(product?.variants.map(item => item.color) ?? [])];
  return <div>
    <label className="block text-sm font-medium text-ink">Escolha uma peça
      <select className="mt-2 min-h-12 w-full min-w-0 rounded-belin-md border border-nude bg-white px-3 text-base" value={product?.id ?? ""} onChange={event => {
        const next = products.find(item => item.id === event.target.value);
        const first = next?.variants.find(item => item.available);
        onSelect(next && first ? { productId: next.id, variantId: first.id } : null);
      }}><option value="">Selecione no catálogo</option>{products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    </label>
    {product && variant ? <section className="mt-5 rounded-belin-md border border-nude p-4" aria-label="Peça selecionada">
      <div className="flex min-w-0 gap-4">
        {product.image ? <Image src={product.image.url} alt={product.image.alt || product.name} width={120} height={150} unoptimized className="aspect-[4/5] w-24 shrink-0 self-start rounded-belin-sm bg-cream object-contain" /> : null}
        <div className="min-w-0"><h3 className="break-words font-display text-2xl text-wine">{product.name}</h3><p className="mt-2 break-all text-xs text-muted">Referência: {product.slug}</p><p className="mt-3 text-sm text-success">{variant.color} · {variant.size} · Disponível</p></div>
      </div>
      <fieldset className="mt-5"><legend className="text-sm font-medium">Cor</legend><div className="mt-2 flex flex-wrap gap-2">{colors.map(color => {
        const available = product.variants.some(item => item.color === color && item.available);
        return <button key={color} type="button" disabled={!available} aria-pressed={variant.color === color} className={`min-h-11 max-w-full break-words rounded-full border px-4 py-2 text-sm disabled:opacity-50 ${variant.color === color ? "border-wine bg-wine text-white" : "border-nude hover:bg-cream"}`} onClick={() => { const next = selectVariantForColor(product.variants, color, variant.size); if (next) onSelect({ productId: product.id, variantId: next.id }); }}>{color}{!available ? " — indisponível" : ""}</button>;
      })}</div></fieldset>
      <fieldset className="mt-5"><legend className="text-sm font-medium">Tamanho</legend><div className="mt-2 flex flex-wrap gap-2">{getVariantSizes(product.variants, variant.color).map(option => <button key={option.size} type="button" disabled={!option.available} aria-label={`${option.size}${option.available ? "" : " — indisponível nesta cor"}`} aria-pressed={variant.size === option.size} className={`min-h-11 min-w-11 rounded-belin-sm border px-3 py-2 text-sm disabled:line-through disabled:opacity-50 ${variant.size === option.size ? "border-wine bg-wine text-white" : "border-nude hover:bg-cream"}`} onClick={() => { const next = product.variants.find(item => item.color === variant.color && item.size === option.size && item.available); if (next) onSelect({ productId: product.id, variantId: next.id }); }}>{option.size}</button>)}</div></fieldset>
    </section> : null}
    {!products.length ? <p className="mt-4 text-sm leading-6 text-muted">Não há peças disponíveis para selecionar neste momento.</p> : null}
    <Link href="/catalogo" className="mt-4 inline-flex min-h-11 items-center rounded text-sm text-wine underline underline-offset-4">Ver catálogo completo</Link>
  </div>;
}
