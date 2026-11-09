// RUAN MARCELO RAMACIOTI LUZ
import type { Metadata } from "next";
import "./globals.css";
import { storeConfig } from "@/config/store";
import { CookieConsent } from "@/components/cookie-consent";
import { FavoritesProvider } from "@/components/favorites/provider";

export const metadata: Metadata = {
  metadataBase: new URL(storeConfig.appUrl),
  title: { default: storeConfig.name, template: "%s | " + storeConfig.name },
  description: "Uma vitrine digital de moda feminina.",
  openGraph: { type: "website", locale: "pt_BR", siteName: storeConfig.name, title: storeConfig.name, description: "Uma vitrine digital de moda feminina." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><FavoritesProvider>{children}<CookieConsent /></FavoritesProvider></body></html>;
}
