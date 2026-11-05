"use client";

import Link from "next/link";

type Props = { accepted: boolean; disabled: boolean; onChange: (accepted: boolean) => void };

export function FittingConsent({ accepted, disabled, onChange }: Props) {
  return <div>
    <p className="text-sm leading-7 text-muted">Ao iniciar, sua fotografia e a imagem da peça serão enviadas ao serviço FASHN para gerar uma simulação visual. Não use o resultado como garantia de tamanho, caimento ou aparência física exata.</p>
    <p className="mt-4 text-sm leading-7 text-muted">A foto não é adicionada ao catálogo nem salva por esta interface. Informações sobre o fornecedor, retenção e tratamento dos dados devem estar aprovadas pela loja antes da ativação do serviço.</p>
    <Link href="/privacidade#provador" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded text-sm text-wine underline underline-offset-4">Ler informações de privacidade (nova aba)</Link>
    <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 rounded-belin-md border border-nude bg-cream p-4 text-sm leading-6">
      <input type="checkbox" checked={accepted} required disabled={disabled} className="mt-1 h-5 w-5 shrink-0 accent-wine" onChange={event => onChange(event.target.checked)} />
      <span>Li as informações de privacidade e autorizo o envio desta fotografia ao FASHN para esta experimentação.</span>
    </label>
    <p className="mt-3 text-xs leading-6 text-muted">Você pode desistir antes de enviar. Se cancelar depois do envio, a espera será interrompida aqui, mas isso não garante a interrupção ou exclusão no serviço externo.</p>
  </div>;
}
