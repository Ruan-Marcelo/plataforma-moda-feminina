"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { VirtualTryOnUpload } from "@/components/virtual-try-on-upload";
import { findAvailableVariant } from "@/features/products/selection";
import { fittingErrorMessages, hasProviderImage, type FittingProduct, type FittingSelection } from "@/features/virtual-fitting/contracts";
import { useVirtualFitting } from "@/features/virtual-fitting/use-virtual-fitting";
import { GarmentPicker } from "./garment-picker";
import { FittingConsent } from "./consent";
import { FittingResultView } from "./result";

type Props = { products: FittingProduct[]; initialSelection: FittingSelection | null; selectionError: boolean; catalogUnavailable: boolean; serviceAvailable: boolean; whatsappConfigured: boolean };
const titles = { intro: "Vista uma nova possibilidade.", selection: "Qual peça você quer experimentar?", photo: "Escolha sua fotografia.", consent: "Sua escolha, com privacidade.", result: "Sua simulação visual." };

export function VirtualFittingExperience({ products, initialSelection, selectionError, catalogUnavailable, serviceAvailable, whatsappConfigured }: Props) {
  const { state, dispatch, busy, previewUrl, selectPhoto, submit, cancel } = useVirtualFitting(initialSelection);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(state.step);
  const product = products.find(item => item.id === state.selection?.productId);
  const variant = product && state.selection ? findAvailableVariant(product.variants, state.selection.variantId) : null;
  const imageReady = hasProviderImage(product?.image?.url);
  const serviceBlocked = !serviceAvailable || state.error === "not_configured" || state.error === "not_enabled";
  const canSubmit = !serviceBlocked && imageReady && Boolean(variant && state.photo && state.consent) && !state.checkingPhoto && !busy;

  useEffect(() => {
    if (previousStep.current !== state.step) { previousStep.current = state.step; heading.current?.focus(); }
  }, [state.step]);

  return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12" data-fitting-status={state.status}>
    <p className="text-xs uppercase tracking-[0.25em] text-wine">BÉLIN · Provador virtual</p>
    <h1 ref={heading} tabIndex={-1} className="mt-4 break-words font-display text-4xl leading-tight text-wine sm:text-5xl">{titles[state.step]}</h1>
    {state.step === "intro" ? <>
      <p className="mt-6 max-w-2xl text-base leading-8 text-muted">Escolha uma peça, envie uma fotografia sua e confira uma simulação visual quando o serviço estiver disponível. O resultado não substitui uma prova de roupa e não garante tamanho ou caimento.</p>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Como funciona">{["Escolha a peça e sua variante", "Prepare uma fotografia sua", "Autorize a geração da simulação"].map((text, index) => <li key={text} className="rounded-belin-lg border border-nude bg-white p-5"><span className="font-display text-3xl text-wine">0{index + 1}</span><p className="mt-3 text-sm leading-6 text-muted">{text}</p></li>)}</ol>
      {!serviceAvailable ? <p className="mt-6 rounded-belin-md border border-nude bg-white p-5 text-sm leading-7 text-muted">O serviço de IA ainda não está habilitado neste ambiente. Você pode preparar sua seleção e visualizar a foto localmente. O envio permanece bloqueado, e nenhum resultado de demonstração será apresentado.</p> : null}
      <Button type="button" className="mt-7 min-h-12 w-full sm:w-auto" onClick={() => dispatch({ type: "start" })}>Começar agora</Button>
    </> : <>
      <ol className="mt-6 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4" aria-label="Etapas do provador">{([{ step: "selection", label: "1. Peça" }, { step: "photo", label: "2. Fotografia" }, { step: "consent", label: "3. Autorização" }, { step: "result", label: "4. Resultado" }] as const).map(item => <li key={item.step} aria-current={state.step === item.step ? "step" : undefined} className={`rounded-full border px-3 py-3 text-center ${state.step === item.step ? "border-wine bg-wine text-white" : "border-nude text-muted"}`}>{item.label}</li>)}</ol>
      <section className="mt-6 min-w-0 rounded-belin-lg border border-nude bg-white p-5 sm:p-8" aria-label="Experimentação virtual">
        {state.error ? <p role="alert" className="mb-5 rounded-belin-md border border-danger/30 bg-cream p-4 text-sm leading-6 text-danger">{fittingErrorMessages[state.error]}</p> : null}
        {state.status === "cancelled" ? <div role="status" className="rounded-belin-md border border-nude bg-cream p-5"><p className="text-sm leading-7 text-muted">Sessão cancelada. A pré-visualização foi removida. Se a foto já foi enviada, o processamento no serviço externo pode continuar.</p><Button type="button" variant="secondary" className="mt-4" onClick={() => dispatch({ type: "restart" })}>Recomeçar</Button></div> : <>
          {state.step === "selection" ? <>
            {selectionError && !state.selection ? <div className="mb-5 rounded-belin-md border border-nude bg-cream p-4" role="alert"><h2 className="text-sm font-semibold text-wine">Seleção indisponível</h2><p className="mt-2 text-sm leading-6 text-muted">A peça ou a variante recebida não está disponível. Escolha uma opção atualizada abaixo.</p></div> : null}
            {catalogUnavailable ? <p className="mb-5 text-sm leading-6 text-muted" role="status">Não foi possível carregar o catálogo agora. Tente novamente mais tarde.</p> : null}
            <GarmentPicker products={products} selection={state.selection} onSelect={selection => dispatch({ type: "select", selection })} />
            <Button type="button" className="mt-6 min-h-12 w-full" disabled={!variant} onClick={() => dispatch({ type: "confirm_selection" })}>Continuar para fotografia</Button>
          </> : null}
          {state.step === "photo" ? <>
            <p className="mb-5 break-words text-sm text-wine">{product?.name} · {variant?.color} · {variant?.size}</p>
            <VirtualTryOnUpload previewUrl={previewUrl} disabled={busy} checking={state.checkingPhoto} onSelect={file => { void selectPhoto(file); }} onRemove={cancel} />
            <div className="mt-6 grid gap-3"><Button type="button" className="min-h-12" disabled={!state.photo || state.checkingPhoto} onClick={() => dispatch({ type: "confirm_photo" })}>Continuar para autorização</Button><Button type="button" variant="quiet" onClick={() => dispatch({ type: "edit_selection" })}>Alterar peça</Button></div>
          </> : null}
          {state.step === "consent" ? <>
            <p className="mb-5 break-words rounded-belin-md bg-cream p-4 text-sm text-wine">{product?.name} · {variant?.color} · {variant?.size}</p>
            <FittingConsent accepted={state.consent} disabled={busy} onChange={accepted => dispatch({ type: "consent", accepted })} />
            {serviceBlocked ? <p className="mt-5 rounded-belin-md border border-nude p-4 text-sm leading-7 text-muted">Processamento indisponível: a loja ainda precisa habilitar o serviço real e concluir a configuração de privacidade. Sua fotografia não será enviada ao serviço de IA.</p> : !imageReady ? <p className="mt-5 rounded-belin-md border border-nude p-4 text-sm leading-7 text-muted">Esta peça ainda precisa de uma fotografia pública compatível com o serviço. Imagens locais ou ilustrações de demonstração não podem ser usadas para gerar uma simulação.</p> : null}
            {busy ? <div className="mt-6" role="status" aria-live="polite"><p className="text-sm font-medium text-wine">{state.status === "uploading" ? "Enviando sua fotografia…" : "Criando sua simulação visual…"}</p><progress className="mt-3 h-2 w-full accent-wine" aria-label={state.status === "uploading" ? "Envio da fotografia" : "Processamento da simulação"} max={state.status === "uploading" ? 100 : undefined} value={state.status === "uploading" ? state.progress ?? undefined : undefined} />{state.status === "uploading" && state.progress !== null ? <p className="mt-2 text-xs text-muted">{state.progress}% do envio concluído</p> : <p className="mt-2 text-xs leading-6 text-muted">O tempo depende do envio e da resposta do serviço. Você pode cancelar a espera.</p>}</div> : null}
            <div className="mt-6 grid gap-3"><Button type="button" className="min-h-12" disabled={!canSubmit} aria-busy={busy} onClick={() => { void submit(canSubmit); }}>{busy ? "Solicitação em andamento" : state.status === "failed" ? "Tentar novamente" : "Gerar simulação"}</Button><Button type="button" variant="quiet" disabled={busy} onClick={() => dispatch({ type: "edit_photo" })}>Rever fotografia</Button><Button type="button" variant="quiet" onClick={cancel}>{busy ? "Cancelar envio e espera" : "Cancelar e limpar fotografia"}</Button></div>
          </> : null}
          {state.step === "result" && state.result && previewUrl && state.selection ? <FittingResultView key={state.result.resultUrl} result={state.result} originalUrl={previewUrl} selection={state.selection} whatsappConfigured={whatsappConfigured} onAnother={() => dispatch({ type: "another_piece" })} onClear={cancel} /> : null}
        </>}
      </section>
    </>}
  </div>;
}
