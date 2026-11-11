// RUAN MARCELO RAMACIOTI LUZ
import Link from "next/link";
import { storeConfig } from "@/config/store";
import { createWhatsAppLink } from "@/lib/whatsapp";
import { StoreContact } from "@/components/store-contact";

const footerLink = "inline-flex min-h-11 items-center rounded px-1 text-sm underline-offset-4 hover:text-wine hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine";

export function SiteFooter() {
  const whatsappUrl = storeConfig.whatsappNumber ? createWhatsAppLink(storeConfig.whatsappNumber) : null;

  return (
    <footer className="border-t border-nude bg-cream">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 text-sm text-muted md:grid-cols-[1fr_auto] md:items-center md:px-8">
        <Link href="/" className="inline-flex min-h-11 w-fit items-center rounded font-display text-3xl tracking-[0.08em] text-wine focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine" aria-label={`${storeConfig.name}, página inicial`}>{storeConfig.name}</Link>
        <nav className="grid grid-cols-2 gap-x-6 md:flex md:flex-wrap md:gap-x-5" aria-label="Links institucionais">
          <Link href="/contato" className={footerLink}>Atendimento</Link>
          <Link href="/privacidade" className={footerLink}>Privacidade</Link>
          {whatsappUrl ? <StoreContact configured href={whatsappUrl} label="WhatsApp" className={footerLink} /> : null}
          {storeConfig.instagramUrl ? <a href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className={footerLink}>@usebelin</a> : null}
        </nav>
      </div>
      <p className="border-t border-nude/70 px-5 py-4 text-center text-xs text-muted md:px-8">© {new Date().getFullYear()} {storeConfig.name}</p>
    </footer>
  );
}
