"use client";

import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { canOptimizeCatalogImage } from "@/features/products/image-policy";

type GalleryImage = { id: string; url: string; alt: string };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const imageId = useId();
  const index = activeIndex < images.length ? activeIndex : 0;
  const activeImage = images[index];

  function move(direction: -1 | 1) {
    setActiveIndex(current => (current + direction + images.length) % images.length);
  }

  function navigateWithKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (images.length < 2 || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "Home") { event.preventDefault(); setActiveIndex(0); }
    if (event.key === "End") { event.preventDefault(); setActiveIndex(images.length - 1); }
  }

  if (!activeImage) return <div className="flex aspect-[4/5] w-full items-center justify-center rounded-belin-lg border border-nude bg-white p-8 text-center text-sm text-muted">As fotografias desta peça ainda não foram cadastradas.</div>;

  return (
    <section className="min-w-0" aria-label={`Galeria de ${productName}`} aria-roledescription="carrossel" onKeyDown={navigateWithKeyboard}>
      <div id={imageId} className="relative overflow-hidden rounded-belin-lg border border-nude bg-white" tabIndex={images.length > 1 ? 0 : undefined} aria-label="Fotografia da peça. Use as setas para navegar." style={{ touchAction: "pan-y pinch-zoom" }}
        onTouchStart={event => {
          const touch = event.touches.length === 1 ? event.touches[0] : undefined;
          touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchEnd={event => {
          const start = touchStart.current;
          const end = event.changedTouches[0];
          touchStart.current = null;
          if (!start || !end || images.length < 2) return;
          const dx = end.clientX - start.x;
          const dy = end.clientY - start.y;
          if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
        }}
        onTouchCancel={() => { touchStart.current = null; }}
      >
        {failedImages.includes(activeImage.id) ? <div className="flex aspect-[4/5] items-center justify-center p-8 text-center text-sm text-muted">Não foi possível carregar esta fotografia. Tente outra imagem.</div> : <Image src={activeImage.url} alt={activeImage.alt || `${productName}, fotografia ${index + 1}`} width={1000} height={1250} sizes="(min-width: 1024px) 55vw, 100vw" unoptimized={!canOptimizeCatalogImage(activeImage.url)} priority={index === 0} className="aspect-[4/5] h-auto w-full object-contain" onError={() => setFailedImages(current => [...current, activeImage.id])} />}
        {images.length > 1 ? <>
          <button type="button" className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-nude bg-white/95 text-3xl text-wine shadow-belin-soft hover:bg-cream" aria-label="Imagem anterior" aria-controls={imageId} onClick={() => move(-1)}>‹</button>
          <button type="button" className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-nude bg-white/95 text-3xl text-wine shadow-belin-soft hover:bg-cream" aria-label="Próxima imagem" aria-controls={imageId} onClick={() => move(1)}>›</button>
        </> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted"><p aria-live="polite" aria-atomic="true">Fotografia {index + 1} de {images.length}</p>{images.length > 1 ? <p>Deslize para ver mais</p> : null}</div>
      {images.length > 1 ? <div className="mt-4 grid grid-cols-5 gap-2" role="group" aria-label="Selecionar fotografia">{images.map((image, imageIndex) => <button key={image.id} type="button" aria-pressed={imageIndex === index} aria-controls={imageId} aria-label={`Ver fotografia ${imageIndex + 1}`} className={`min-h-11 min-w-0 overflow-hidden rounded-belin-sm border-2 bg-white p-0.5 ${imageIndex === index ? "border-wine" : "border-transparent hover:border-nude"}`} onClick={() => setActiveIndex(imageIndex)}><Image src={image.url} alt="" width={100} height={125} sizes="(min-width: 1024px) 120px, 20vw" loading="lazy" unoptimized={!canOptimizeCatalogImage(image.url)} className="aspect-[4/5] h-auto w-full object-cover" /></button>)}</div> : null}
    </section>
  );
}
