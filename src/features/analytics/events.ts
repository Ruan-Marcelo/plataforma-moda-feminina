// RUAN MARCELO RAMACIOTI LUZ
import { z } from "zod";

export const analyticsEventNameSchema = z.enum(["page_view", "product_view", "collection_view", "search", "filter_applied", "virtual_try_on_started", "virtual_try_on_completed", "whatsapp_click"]);
const metadataValueSchema = z.union([z.string().max(500), z.number().finite(), z.boolean(), z.null()]);

export const analyticsEventSchema = z.object({
  name: analyticsEventNameSchema,
  anonymousId: z.string().trim().min(16).max(128),
  productId: z.string().cuid().optional(),
  metadata: z.record(z.string().max(80), metadataValueSchema).optional(),
  analyticsConsent: z.literal(true),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
