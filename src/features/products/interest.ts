import { z } from "zod";
import { createWhatsAppLink } from "@/lib/whatsapp";

const interestSchema = z.object({
  number: z.string().regex(/^\d{10,15}$/),
  product: z.object({
    id: z.string().cuid(),
    name: z.string().trim().min(1).max(160),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
    url: z.string().url().refine(value => ["http:", "https:"].includes(new URL(value).protocol)),
  }),
  variant: z.object({
    id: z.string().cuid(),
    color: z.string().trim().min(1).max(60),
    size: z.string().trim().min(1).max(30),
    available: z.literal(true),
  }).optional(),
});

export function createProductInterestLink(input: z.input<typeof interestSchema>) {
  const { number, product, variant } = interestSchema.parse(input);
  const description = `${product.name}, referência ${product.slug}${variant ? `, tamanho: ${variant.size}, cor: ${variant.color}, variante: ${variant.id}` : ""}`;
  return createWhatsAppLink(number, description, product.url);
}
