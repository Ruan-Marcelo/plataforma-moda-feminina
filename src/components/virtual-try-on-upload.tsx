"use client";

import Image from "next/image";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  previewUrl: string | null;
  disabled: boolean;
  checking: boolean;
  onSelect: (file: File | undefined) => void;
  onRemove: () => void;
};

export function VirtualTryOnUpload({ previewUrl, disabled, checking, onSelect, onRemove }: Props) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const hintId = useId();
  return <div>
    <p id={hintId} className="text-sm leading-7 text-muted">JPG, PNG ou WebP, com até 8 MB. A pré-visualização fica nesta sessão e não é enviada ao selecionar o arquivo.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <Button type="button" variant="secondary" disabled={disabled || checking} onClick={() => gallery.current?.click()}>Escolher na galeria</Button>
      <Button type="button" variant="secondary" disabled={disabled || checking} onClick={() => camera.current?.click()}>Usar câmera, se disponível</Button>
    </div>
    <input ref={gallery} aria-label="Fotografia da galeria" aria-describedby={hintId} className="sr-only" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || checking} onChange={event => { onSelect(event.target.files?.[0]); event.target.value = ""; }} />
    <input ref={camera} aria-label="Fotografia pela câmera" aria-describedby={hintId} className="sr-only" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" capture="user" disabled={disabled || checking} onChange={event => { onSelect(event.target.files?.[0]); event.target.value = ""; }} />
    <p className="mt-3 text-xs leading-5 text-muted">A câmera depende do aparelho e do navegador. Caso ela não esteja disponível, escolha uma foto da galeria.</p>
    {checking ? <p className="mt-4 text-sm text-wine" role="status">Conferindo a fotografia neste dispositivo…</p> : null}
    {previewUrl ? <figure className="mt-6 rounded-belin-lg border border-nude bg-cream p-3">
      <Image src={previewUrl} alt="Pré-visualização da sua fotografia" width={600} height={800} unoptimized referrerPolicy="no-referrer" className="max-h-96 w-full rounded-belin-md object-contain" />
      <figcaption className="mt-3 text-center text-xs text-muted">Sua fotografia original · pré-visualização local</figcaption>
      <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button type="button" variant="quiet" disabled={disabled || checking} onClick={() => gallery.current?.click()}>Substituir fotografia</Button><Button type="button" variant="quiet" disabled={disabled} onClick={onRemove}>Remover fotografia</Button></div>
    </figure> : null}
    <aside className="mt-6 rounded-belin-md border border-nude bg-cream p-5" aria-label="Orientações para a fotografia">
      <h3 className="text-sm font-semibold text-wine">Para uma imagem mais útil</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted"><li>Prefira boa iluminação e uma fotografia nítida.</li><li>Mantenha o corpo visível e evite objetos cobrindo a roupa.</li><li>Use uma fotografia sua. Não envie imagens íntimas ou de outras pessoas.</li></ul>
    </aside>
  </div>;
}
