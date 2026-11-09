// RUAN MARCELO RAMACIOTI LUZ
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { storeConfig } from "@/config/store";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/categorias", label: "Categorias" },
  { href: "/provador", label: "Provador virtual" },
  { href: "/contato", label: "Contato" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <header className="relative border-b border-nude/70 bg-cream/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3 rounded focus-visible:outline-none" aria-label={`${storeConfig.name}, página inicial`} onClick={() => setOpen(false)}>
          <Image src="/brand/belin-logo.jpeg" alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" priority />
          <span className="font-display text-3xl tracking-[0.08em] text-wine">{storeConfig.name}</span>
        </Link>

        <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-wine px-3 text-sm text-wine md:hidden" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen((current) => !current)}>
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          <span aria-hidden="true" className="text-lg">{open ? "×" : "☰"}</span>
        </button>

        <nav id="main-navigation" className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full z-20 flex-col gap-1 border-b border-nude bg-cream px-5 py-4 shadow-belin-soft md:static md:flex md:w-auto md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none`} aria-label="Navegação principal">
          {links.map((link) => <Link key={link.href} href={link.href} className="rounded-full px-4 py-3 text-sm whitespace-nowrap transition-colors hover:bg-white focus-visible:bg-white" onClick={() => setOpen(false)}>{link.label}</Link>)}
          {storeConfig.instagramUrl ? <a href={storeConfig.instagramUrl} target="_blank" rel="noreferrer" className="rounded-full px-4 py-3 text-sm whitespace-nowrap transition-colors hover:bg-white focus-visible:bg-white" onClick={() => setOpen(false)}>Instagram</a> : null}
        </nav>
      </div>
    </header>
  );
}
