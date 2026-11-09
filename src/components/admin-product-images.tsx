// RUAN MARCELO RAMACIOTI LUZ
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type ImageItem = { id: string; url: string; alt: string; sortOrder: number };

function isImageList(value: unknown): value is { items: ImageItem[] } {
  return typeof value === "object" && value !== null && Array.isArray((value as { items?: unknown }).items);
}

export function AdminProductImages({ productId, initialImages }: { productId: string; initialImages?: ImageItem[] }) {
  const [images, setImages] = useState<ImageItem[]>(initialImages ?? []);
  const [alt, setAlt] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/products/${productId}/images`, { cache: "no-store" });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok || !isImageList(data)) throw new Error("images_unavailable");
    setImages(data.items);
  }, [productId]);

  useEffect(() => { if (initialImages) setImages(initialImages); else void load().catch(() => setMessage("Não foi possível carregar as imagens.")); }, [load, initialImages]);

  async function upload() {
    const file = fileInput.current?.files?.[0];
    if (!file || !alt.trim()) { setMessage("Selecione uma imagem e informe o texto alternativo."); return; }
    setBusy(true); setMessage("");
    try {
      const body = new FormData();
      body.set("file", file); body.set("alt", alt.trim());
      const response = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body });
      if (!response.ok) throw new Error("upload_failed");
      if (fileInput.current) fileInput.current.value = "";
      setAlt("");
      await load();
      setMessage("Imagem adicionada.");
    } catch { setMessage("Não foi possível enviar a imagem. Verifique o storage e o arquivo."); }
    finally { setBusy(false); }
  }

  async function remove(image: ImageItem) {
    if (!window.confirm(`Excluir a imagem “${image.alt}”?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/products/${productId}/images/${image.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete_failed");
      await load(); setMessage("Imagem excluída.");
    } catch { setMessage("Não foi possível excluir a imagem."); }
    finally { setBusy(false); }
  }

  return <div className="mt-5 border-t border-nude pt-4">
    <h5 className="text-sm font-semibold text-wine">Imagens</h5>
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <label className="text-xs">Arquivo<input ref={fileInput} className="mt-1 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} /></label>
      <label className="text-xs">Texto alternativo<input className="mt-1 min-h-10 w-full rounded border border-nude px-2 text-sm" value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={160} disabled={busy} /></label>
      <button className="min-h-10 self-end rounded-full bg-wine px-4 text-xs text-white disabled:opacity-50" type="button" onClick={() => void upload()} disabled={busy}>Enviar</button>
    </div>
    {images.length ? <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image) => <li key={image.id} className="rounded border border-nude p-2"><Image className="aspect-square h-auto w-full rounded object-cover" src={image.url} alt={image.alt} width={240} height={240} loading="lazy" unoptimized /><button className="mt-2 min-h-11 px-2 text-xs text-red-800 underline" type="button" onClick={() => void remove(image)} disabled={busy}>Excluir</button></li>)}</ul> : <p className="mt-3 text-xs text-stone-500">Nenhuma imagem cadastrada.</p>}
    <p className="mt-2 text-xs text-stone-600" aria-live="polite">{message}</p>
  </div>;
}
