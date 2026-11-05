// RUAN MARCELO RAMACIOTI LUZ
"use client";

import { useState } from "react";
import { createWhatsAppLink } from "@/lib/whatsapp";

type Variant = { id: string; size: string; color: string; colorHex: string | null; available: boolean };
type Props = { productName: string; productUrl: string; whatsappNumber?: string; variants: Variant[] };

export function ProductVariantSelector({ productName, productUrl, whatsappNumber, variants }: Props) {
  const available = variants.filter((variant) => variant.available);
  const colors = [...new Set(available.map((variant) => variant.color))];
  const [color, setColor] = useState(colors[0] ?? "");
  const sizesForColor = available.filter((variant) => variant.color === color).map((variant) => variant.size);
  const [size, setSize] = useState(sizesForColor[0] ?? "");
  const selected = available.find((variant) => variant.color === color && variant.size === size);
  const unavailable = variants.filter((variant) => !variant.available);
  const interestName = selected ? `${productName} (cor: ${selected.color}; tamanho: ${selected.size})` : productName;
  const whatsappUrl = whatsappNumber && selected ? createWhatsAppLink(whatsappNumber, interestName, productUrl) : null;

  function changeColor(nextColor: string) {
    setColor(nextColor);
    const nextSize = available.find((variant) => variant.color === nextColor)?.size ?? "";
    setSize(nextSize);
  }

  function changeSize(nextSize: string) {
    if (available.some((variant) => variant.color === color && variant.size === nextSize)) setSize(nextSize);
  }

  return <section className="mt-8 border-t border-nude pt-6" aria-label="Opções da peça"><div className="grid gap-6 sm:grid-cols-2"><fieldset><legend className="text-sm font-semibold">Cor</legend>{colors.length ? <div className="mt-3 flex flex-wrap gap-2">{colors.map((option) => <button key={option} type="button" className={`min-h-11 rounded-full border px-4 text-sm ${option === color ? "border-wine bg-wine text-white" : "border-nude text-ink hover:bg-nude"}`} aria-pressed={option === color} onClick={() => changeColor(option)}>{option}</button>)}</div> : <p className="mt-3 text-sm text-muted">Nenhuma cor disponível.</p>}</fieldset><fieldset><legend className="text-sm font-semibold">Tamanho</legend>{sizesForColor.length ? <div className="mt-3 flex flex-wrap gap-2">{sizesForColor.map((option) => <button key={option} type="button" className={`min-h-11 min-w-11 rounded-full border px-3 text-sm ${option === size ? "border-wine bg-wine text-white" : "border-nude text-ink hover:bg-nude"}`} aria-pressed={option === size} onClick={() => changeSize(option)}>{option}</button>)}</div> : <p className="mt-3 text-sm text-muted">Nenhum tamanho disponível para esta cor.</p>}</fieldset></div>{selected ? <p className="mt-5 text-sm text-success" role="status">Disponível: {selected.color} · {selected.size}</p> : <p className="mt-5 text-sm text-muted" role="status">Selecione uma combinação disponível.</p>}{unavailable.length ? <><p className="mt-4 text-xs text-muted">Combinações indisponíveis:</p><ul className="mt-2 flex flex-wrap gap-2" aria-label="Combinações indisponíveis">{unavailable.map((variant) => <li key={variant.id} className="rounded-full border border-nude px-3 py-2 text-xs text-muted">{variant.color} · {variant.size}</li>)}</ul></> : null}<div className="mt-6 flex flex-col gap-3 sm:flex-row"><a href={selected ? "#provador" : undefined} aria-disabled={!selected} className={`inline-flex min-h-12 items-center justify-center rounded-full border border-wine px-5 text-sm ${selected ? "text-wine hover:bg-nude" : "pointer-events-none text-muted opacity-50"}`}>Experimentar virtualmente</a>{whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-wine px-5 text-sm text-white hover:bg-wine-dark">Tenho interesse</a> : <p className="flex min-h-12 items-center text-sm text-muted">WhatsApp ainda não configurado.</p>}</div></section>;
}
