// RUAN MARCELO RAMACIOTI LUZ
import Link from "next/link";
import { storeConfig } from "@/config/store";
import { createWhatsAppLink } from "@/lib/whatsapp";

export function SiteFooter() {
  const whatsappUrl = storeConfig.whatsappNumber ? createWhatsAppLink(storeConfig.whatsappNumber) : null;

  return (
    <footer className="border-t border-nude bg-cream">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-muted md:grid-cols-[1fr_auto] md:px-8">
        <div><p className="font-display text-3xl text-wine">{storeConfig.name}</p><p className="mt-2 max-w-sm leading-6">Moda feminina para vestir a sua essência com presença e intenção.</p></div>
        <nav className="flex flex-wrap items-start gap-x-5 gap-y-3" aria-label="Links institucionais">
          <Link href="/privacidade" className="rounded px-1 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine">Privacidade</Link>
          {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded px-1 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine">WhatsApp</a> : null}
          {storeConfig.instagramUrl ? <a href={storeConfig.instagramUrl} target="_blank" rel="noreferrer" className="rounded px-1 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine">@usebelin</a> : null}
        </nav>
      </div>
      <p className="border-t border-nude/70 px-5 py-4 text-center text-xs text-muted md:px-8">© {new Date().getFullYear()} {storeConfig.name}</p>
    </footer>
  );
}
