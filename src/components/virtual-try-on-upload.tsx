// RUAN MARCELO RAMACIOTI LUZ
"use client";

import { useEffect, useState } from "react";

type Props = { productId: string };
type Status = "idle" | "uploading" | "success" | "error";

const maxFileSize = 8 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function VirtualTryOnUpload({ productId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function selectFile(selected: File | undefined) {
    setResultUrl(null);
    if (!selected) return;
    if (!acceptedTypes.has(selected.type) || selected.size <= 0 || selected.size > maxFileSize) {
      setFile(null); setPreviewUrl(null); setStatus("error"); setMessage("Escolha uma imagem JPG, PNG ou WebP de até 8 MB."); return;
    }
    setFile(selected); setPreviewUrl(URL.createObjectURL(selected)); setStatus("idle"); setMessage("");
  }

  async function submit() {
    if (!file) { setStatus("error"); setMessage("Selecione uma fotografia antes de continuar."); return; }
    setStatus("uploading"); setMessage("Enviando sua fotografia com segurança…");
    const body = new FormData(); body.set("productId", productId); body.set("image", file);
    try {
      const response = await fetch("/api/virtual-fitting", { method: "POST", body });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object" || !("resultUrl" in data) || typeof data.resultUrl !== "string") {
        setStatus("error"); setMessage(response.status === 503 ? "O provador ainda não está disponível neste ambiente." : "Não foi possível processar esta fotografia. Tente outra imagem."); return;
      }
      setResultUrl(data.resultUrl); setStatus("success"); setMessage("Simulação pronta. O resultado é apenas uma referência visual.");
    } catch { setStatus("error"); setMessage("Não foi possível conectar ao provador. Tente novamente."); }
  }

  return <section className="mt-10 rounded-2xl border border-nude bg-white p-5" aria-labelledby="try-on-title"><h2 id="try-on-title" className="font-display text-3xl text-wine">Experimentar virtualmente</h2><p className="mt-3 text-sm leading-6 text-stone-600">Envie uma foto nítida, com boa iluminação e o corpo visível. A imagem será validada no servidor e usada somente para esta solicitação.</p><label className="mt-5 block text-sm font-medium" htmlFor="try-on-image">Sua fotografia<input id="try-on-image" className="mt-2 block min-h-11 w-full rounded border border-nude p-2 text-sm" type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={(event) => selectFile(event.target.files?.[0])} /></label>{previewUrl ? <img src={previewUrl} alt="Pré-visualização da fotografia selecionada" className="mt-4 max-h-72 w-full rounded object-contain" /> : null}<button type="button" className="mt-5 min-h-11 rounded-full bg-wine px-5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={submit} disabled={status === "uploading" || !file}>{status === "uploading" ? "Processando…" : "Iniciar experimentação"}</button><p className="mt-4 text-sm text-stone-600" aria-live="polite">{message}</p>{status === "success" && resultUrl ? <div className="mt-5 border-t border-nude pt-5"><h3 className="font-display text-2xl text-wine">Resultado da experimentação</h3><img src={resultUrl} alt="Resultado da simulação virtual" className="mt-3 max-h-96 w-full rounded object-contain" /><p className="mt-3 text-xs text-stone-500">A experimentação é uma simulação visual e não garante tamanho, caimento ou aparência física exata.</p></div> : null}</section>;
}
