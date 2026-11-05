// RUAN MARCELO RAMACIOTI LUZ
"use client";

import { useState } from "react";

type GalleryImage = { id: string; url: string; alt: string };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const activeImage = images[activeIndex];

  if (!activeImage) return <div className="flex min-h-80 items-center justify-center rounded-belin-lg bg-nude p-8 text-center text-muted">Nenhuma imagem cadastrada para este produto.</div>;

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  return (
    <section aria-label={`Galeria de imagens de ${productName}`}>
      <div className="relative overflow-hidden rounded-belin-lg bg-nude" onTouchStart={(event) => setTouchStart(event.changedTouches[0]?.clientX ?? null)} onTouchEnd={(event) => { const end = event.changedTouches[0]?.clientX; if (touchStart !== null && end !== undefined && Math.abs(end - touchStart) > 40) move(end < touchStart ? 1 : -1); setTouchStart(null); }}>
        <img src={activeImage.url} alt={activeImage.alt} className="aspect-[4/5] h-auto w-full object-cover" />
        {images.length > 1 ? <><button type="button" className="absolute left-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-cream/90 text-xl text-wine shadow-belin-soft" aria-label="Imagem anterior" onClick={() => move(-1)}>‹</button><button type="button" className="absolute right-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-cream/90 text-xl text-wine shadow-belin-soft" aria-label="Próxima imagem" onClick={() => move(1)}>›</button></> : null}
      </div>
      {images.length > 1 ? <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Selecionar imagem">{images.map((image, index) => <button key={image.id} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Ver imagem ${index + 1}`} className={`shrink-0 overflow-hidden rounded-belin-sm border-2 ${index === activeIndex ? "border-wine" : "border-transparent"}`} onClick={() => setActiveIndex(index)}><img src={image.url} alt="" className="h-20 w-16 object-cover" /></button>)}</div> : null}
    </section>
  );
}
