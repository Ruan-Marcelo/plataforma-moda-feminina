"use client";

import Link from "next/link";
import { useState } from "react";
import { createFittingPath, findAvailableVariant, getVariantSizes, selectVariantForColor, type ProductVariant } from "@/features/products/selection";

type Props = { productId: string; whatsappConfigured: boolean; variants: ProductVariant[] };

export function ProductVariantSelector({ productId, whatsappConfigured, variants }: Props) {
  const firstAvailable = variants.find(variant => variant.available);
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? "");
  const selected = findAvailableVariant(variants, selectedId);
  const color = selected?.color ?? variants[0]?.color ?? "";
  const colors = [...new Set(variants.map(variant => variant.color))];
  const sizes = getVariantSizes(variants, color);
  const disabledAction = "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-nude px-5 py-3 text-center text-sm text-muted disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section className="mt-8 border-t border-nude pt-7" aria-label="Opções da peça">
      <fieldset>
        <legend className="text-sm font-semibold">Cor <span className="ml-2 font-normal text-muted">{color || "Não cadastrada"}</span></legend>
        <div className="mt-3 flex flex-wrap gap-2">{colors.map(option => {
          const available = variants.some(variant => variant.color === option && variant.available);
          const hex = variants.find(variant => variant.color === option)?.colorHex;
          return <button key={option} type="button" disabled={!available} aria-pressed={option === color} aria-label={`${option}${available ? "" : " — indisponível"}`} className={`inline-flex min-h-12 max-w-full items-center gap-2 rounded-full border px-4 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${option === color ? "border-wine bg-white text-wine" : "border-nude hover:bg-white"}`}
            onClick={() => { const next = selectVariantForColor(variants, option, selected?.size); if (next) setSelectedId(next.id); }}
          >{hex && /^#[a-fA-F0-9]{6}$/.test(hex) ? <span className="h-5 w-5 shrink-0 rounded-full border border-black/20" style={{ backgroundColor: hex }} aria-hidden="true" /> : null}<span className="break-words">{option}</span>{!available ? <span className="text-xs">Indisponível</span> : null}</button>;
        })}</div>
        {!colors.length ? <p className="mt-3 text-sm text-muted">As cores ainda não foram cadastradas.</p> : null}
      </fieldset>
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Tamanho</legend>
        <div className="mt-3 flex flex-wrap gap-2">{sizes.map(option => <button key={option.size} type="button" disabled={!option.available} aria-pressed={selected?.size === option.size} aria-label={`${option.size}${!option.exists ? " — não existe nesta cor" : !option.available ? " — indisponível" : ""}`} title={!option.exists ? "Este tamanho não existe nesta cor" : !option.available ? "Combinação indisponível" : undefined} className={`min-h-12 min-w-12 max-w-full break-words rounded-belin-md border px-4 py-3 text-sm disabled:cursor-not-allowed disabled:text-muted disabled:line-through disabled:opacity-50 ${selected?.size === option.size ? "border-wine bg-wine text-white" : "border-nude bg-white hover:border-wine"}`}
          onClick={() => { const next = variants.find(variant => variant.color === color && variant.size === option.size && variant.available); if (next) setSelectedId(next.id); }}
        >{option.size}</button>)}</div>
        {!sizes.length ? <p className="mt-3 text-sm text-muted">Os tamanhos ainda não foram cadastrados.</p> : null}
      </fieldset>
      <div className="mt-6 rounded-belin-md border border-nude bg-white p-4" role="status" aria-live="polite" aria-atomic="true">
        {selected ? <><p className="text-sm font-medium text-success">Disponível · {selected.color} · {selected.size}</p><p className="mt-2 break-all text-xs text-muted">Código da variante: {selected.id}</p></> : <p className="text-sm text-muted">{variants.length ? "Esta peça está indisponível no momento." : "Esta peça ainda não possui variantes cadastradas."}</p>}
      </div>
      <div className="mt-6 grid gap-3">
        {selected ? <Link href={createFittingPath(productId, selected.id)} className="inline-flex min-h-14 items-center justify-center rounded-full border border-wine bg-white px-5 py-4 text-center text-sm font-medium text-wine transition-colors hover:bg-nude">Experimentar virtualmente</Link> : <button type="button" disabled className={disabledAction}>Experimentar virtualmente</button>}
        {selected && whatsappConfigured ? <a href={`/api/products/${productId}/interest?${new URLSearchParams({ variantId: selected.id })}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-full bg-wine px-5 py-4 text-center text-sm font-medium text-white transition-colors hover:bg-wine-dark">Tenho interesse</a> : <button type="button" disabled className={disabledAction}>Tenho interesse</button>}
      </div>
      {!whatsappConfigured ? <p className="mt-3 text-xs leading-5 text-muted">O contato pelo WhatsApp ainda não foi configurado pela loja.</p> : null}
      <p className="mt-3 text-xs leading-5 text-muted">O provador receberá a peça e a variante escolhidas. A navegação não envia fotografias nem inicia processamento.</p>
    </section>
  );
}
