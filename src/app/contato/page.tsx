import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoreContact } from "@/components/store-contact";
import { storeConfig } from "@/config/store";
import { createWhatsAppLink } from "@/lib/whatsapp";

export const metadata = { title: "Contato e atendimento" };
export default function ContactPage() {
  const whatsappUrl = storeConfig.whatsappNumber ? createWhatsAppLink(storeConfig.whatsappNumber) : undefined;
  return <main className="min-h-screen bg-cream text-ink"><SiteHeader /><div className="mx-auto max-w-3xl px-5 py-12 sm:py-16"><p className="text-xs uppercase tracking-[0.2em] text-wine">{storeConfig.name}</p><h1 className="mt-3 font-display text-4xl text-wine sm:text-5xl">Vamos conversar</h1><p className="mt-5 text-sm leading-7 text-muted">Tire dúvidas sobre as peças, cores, tamanhos e disponibilidade pelos canais da loja.</p><section className="mt-8 grid gap-4 rounded-belin-lg border border-nude bg-white p-5" aria-label="Canais de contato"><StoreContact configured={Boolean(whatsappUrl)} href={whatsappUrl} label="Conversar pelo WhatsApp" /><a href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-nude px-4 py-3 text-sm text-wine">Instagram @usebelin</a><p className="text-xs leading-6 text-muted">Ao abrir um canal externo, você decide se deseja enviar a mensagem. Fotografias do provador não são anexadas automaticamente.</p></section>{storeConfig.serviceInformation ? <section className="mt-8" aria-labelledby="service-title"><h2 id="service-title" className="font-display text-2xl text-wine">Informações de atendimento</h2><p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-muted">{storeConfig.serviceInformation}</p></section> : null}<section className="mt-8 border-t border-nude pt-6"><h2 className="font-display text-2xl text-wine">Sobre a BÉLIN</h2><p className="mt-3 text-sm leading-7 text-muted">Moda feminina para vestir a sua essência com presença e intenção.</p><Link href="/privacidade" className="mt-4 inline-flex min-h-12 items-center text-sm text-wine underline">Política de privacidade</Link></section></div><SiteFooter /></main>;
}
