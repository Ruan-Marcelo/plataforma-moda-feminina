// RUAN MARCELO RAMACIOTI LUZ
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { storeConfig } from "@/config/store";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/categorias", label: "Categorias" },
  { href: "/provador", label: "Provador virtual" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/contato", label: "Contato" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) { setOpen(false); menuButton.current?.focus(); }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="relative border-b border-nude/70 bg-cream/95">
      <a href="#page-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:p-4 focus:text-wine">Pular para o conteúdo</a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3 rounded focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-4" aria-label={`${storeConfig.name}, página inicial`} onClick={() => setOpen(false)}>
          <span className="font-display text-3xl tracking-[0.08em] text-wine">{storeConfig.name}</span>
        </Link>

        <button ref={menuButton} type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-wine px-3 text-sm text-wine lg:hidden" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen((current) => !current)}>
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          <span aria-hidden="true" className="text-lg">{open ? "×" : "☰"}</span>
        </button>

        <nav id="main-navigation" className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full z-20 flex-col gap-1 border-b border-nude bg-cream px-5 py-4 shadow-belin-soft lg:static lg:flex lg:w-auto lg:flex-row lg:items-center lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`} aria-label="Navegação principal">
          {links.map((link) => <Link key={link.href} href={link.href} className="rounded-full px-4 py-3 text-sm whitespace-nowrap transition-colors hover:bg-white focus-visible:bg-white" onClick={() => setOpen(false)}>{link.label}</Link>)}
          {storeConfig.instagramUrl ? <a href={storeConfig.instagramUrl} target="_blank" rel="noreferrer" className="rounded-full px-4 py-3 text-sm whitespace-nowrap transition-colors hover:bg-white focus-visible:bg-white" onClick={() => setOpen(false)}>Instagram</a> : null}
        </nav>
      </div>
    </header>
  );
}
