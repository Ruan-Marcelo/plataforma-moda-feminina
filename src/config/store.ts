// RUAN MARCELO RAMACIOTI LUZ
import { env } from "@/lib/env";

export const storeConfig = {
  name: env.STORE_NAME,
  showPrices: env.STORE_SHOW_PRICES,
  appUrl: env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
  instagramUrl: env.STORE_INSTAGRAM_URL,
  whatsappNumber: env.STORE_WHATSAPP_NUMBER,
  serviceInformation: env.STORE_SERVICE_INFORMATION,
} as const;
