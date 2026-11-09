"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StoreContact } from "@/components/store-contact";
import type { FittingResult, FittingSelection } from "@/features/virtual-fitting/contracts";

type Props = { result: FittingResult; originalUrl: string; selection: FittingSelection; whatsappConfigured: boolean; onAnother: () => void; onClear: () => void };
type Comparison = "result" | "original" | "both";

export function FittingResultView({ result, originalUrl, selection, whatsappConfigured, onAnother, onClear }: Props) {
  const [comparison, setComparison] = useState<Comparison>("result");
  const [imageFailed, setImageFailed] = useState(false);
  return <div>
    <p className="text-sm leading-7 text-muted">Esta imagem foi retornada pelo serviço de experimentação. Ela é uma simulação visual e não garante tamanho, caimento ou aparência física exata.</p>
    <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Comparar fotografias">
      {([{ value: "result", label: "Simulação" }, { value: "original", label: "Original" }, { value: "both", label: "Lado a lado" }] as const).map(option => <button key={option.value} type="button" aria-pressed={comparison === option.value} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${comparison === option.value ? "border-wine bg-wine text-white" : "border-nude hover:bg-cream"}`} onClick={() => setComparison(option.value)}>{option.label}</button>)}
    </div>
    <div className={`mt-5 grid min-w-0 gap-3 ${comparison === "both" ? "grid-cols-2" : "grid-cols-1"}`}>
      {comparison !== "result" ? <figure className="min-w-0 rounded-belin-md bg-cream p-2"><Image src={originalUrl} alt="Sua fotografia original" width={600} height={800} unoptimized referrerPolicy="no-referrer" className="aspect-[3/4] h-auto max-h-[36rem] w-full rounded-belin-sm object-contain" /><figcaption className="mt-2 text-center text-xs text-muted">Original</figcaption></figure> : null}
      {comparison !== "original" ? <figure className="min-w-0 rounded-belin-md bg-cream p-2">{imageFailed ? <p className="flex aspect-[3/4] items-center justify-center p-4 text-center text-sm text-muted" role="alert">A imagem retornada não pôde ser carregada. Ela pode ter expirado ou estar temporariamente indisponível.</p> : <Image src={result.resultUrl} alt="Simulação visual retornada pelo serviço" width={600} height={800} unoptimized referrerPolicy="no-referrer" className="aspect-[3/4] h-auto max-h-[36rem] w-full rounded-belin-sm object-contain" onError={() => setImageFailed(true)} />}<figcaption className="mt-2 text-center text-xs text-muted">Simulação visual</figcaption></figure> : null}
    </div>
    <div className="mt-6 grid gap-3"><Button type="button" onClick={onAnother}>Experimentar outra peça</Button><StoreContact configured={whatsappConfigured} productId={selection.productId} variantId={selection.variantId} label="Conversar com a loja" /><Button type="button" variant="quiet" onClick={onClear}>Limpar fotografia e resultado</Button></div>
    <p className="mt-4 text-xs leading-6 text-muted">A conversa com a loja recebe a identificação da peça e da variante. A sua fotografia e a simulação não são anexadas ao WhatsApp.</p>
  </div>;
}
