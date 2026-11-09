import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FavoritesList } from "@/components/favorites/list";
import { storeConfig } from "@/config/store";
export const metadata = { title: "Favoritos" };
export default function FavoritesPage() {
  return <main className="min-h-screen bg-cream text-ink"><SiteHeader /><div id="page-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><h1 className="font-display text-4xl text-wine sm:text-5xl">Seus favoritos</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-muted">Guarde suas peças sem criar uma conta. A lista fica somente neste navegador e pode ser apagada a qualquer momento. Preços e disponibilidade são consultados novamente ao abrir a lista.</p><FavoritesList whatsappConfigured={Boolean(storeConfig.whatsappNumber)} /></div><SiteFooter /></main>;
}
