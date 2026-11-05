import { z } from "zod";
import type { ProductVariant } from "@/features/products/selection";

export const fittingConsentVersion = "virtual-fitting-v1";

export const fittingSubmissionSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid(),
  requestId: z.uuid(),
  consent: z.literal("true"),
  consentVersion: z.literal(fittingConsentVersion),
});

export const fittingResultSchema = z.object({
  resultUrl: z.string().url().refine(value => {
    try {
      const url = new URL(value);
      return url.origin === "https://cdn.fashn.ai" && !url.username && !url.password;
    } catch { return false; }
  }),
  providerRequestId: z.string().min(1).optional(),
});

export type FittingResult = z.infer<typeof fittingResultSchema>;
export type FittingSelection = { productId: string; variantId: string };
export type FittingProduct = {
  id: string;
  name: string;
  slug: string;
  image: { url: string; alt: string } | null;
  variants: ProductVariant[];
};

export function hasProviderImage(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const local = host === "localhost" || host.endsWith(".localhost") || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || ["[::1]", "0.0.0.0"].includes(host);
    return url.protocol === "https:" && !local && !url.username && !url.password && !url.pathname.toLowerCase().endsWith(".svg");
  } catch { return false; }
}

export type FittingErrorCode = "invalid_image" | "invalid_selection" | "consent_required" | "not_configured" | "not_enabled" | "variant_unavailable" | "product_image_unavailable" | "rate_limited" | "request_too_large" | "timeout" | "network" | "invalid_response" | "provider_unavailable" | "duplicate_request";

export const fittingErrorMessages: Record<FittingErrorCode, string> = {
  invalid_image: "Escolha uma fotografia JPG, PNG ou WebP válida, com até 8 MB.",
  invalid_selection: "Escolha uma peça e uma combinação de cor e tamanho disponíveis.",
  consent_required: "Leia as informações de privacidade e autorize o processamento antes de continuar.",
  not_configured: "O serviço de experimentação ainda não está configurado. Nenhum resultado foi gerado.",
  not_enabled: "O processamento ainda não foi habilitado pela loja. Nenhum resultado foi gerado.",
  variant_unavailable: "Esta combinação não está mais disponível. Escolha outra peça ou variante.",
  product_image_unavailable: "A peça precisa de uma fotografia compatível e acessível ao serviço de experimentação.",
  rate_limited: "Você fez várias tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.",
  request_too_large: "A fotografia ultrapassa o limite permitido. Escolha uma imagem de até 8 MB.",
  timeout: "A solicitação demorou mais que o esperado. Você pode tentar novamente ou limpar a fotografia.",
  network: "Não foi possível conectar ao serviço. Confira sua conexão e tente novamente.",
  invalid_response: "O serviço não retornou uma imagem válida. Nenhuma simulação foi apresentada.",
  provider_unavailable: "Não foi possível concluir a experimentação. Tente novamente mais tarde.",
  duplicate_request: "Esta solicitação já foi enviada. Aguarde antes de iniciar uma nova tentativa.",
};
