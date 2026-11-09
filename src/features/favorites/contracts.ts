import { z } from "zod";
export const favoritesStorageKey = "belin:favorites:v1";
export const favoriteIdsSchema = z.array(z.string().cuid()).max(100).transform(ids => [...new Set(ids)]);
const storedSchema = z.object({ version: z.literal(1), ids: favoriteIdsSchema });
export function parseFavorites(value: string | null): string[] {
  if (!value || value.length > 10000) return [];
  try { const parsed = storedSchema.safeParse(JSON.parse(value)); return parsed.success ? parsed.data.ids : []; } catch { return []; }
}
export function serializeFavorites(ids: string[]) { return JSON.stringify({ version: 1, ids: favoriteIdsSchema.parse(ids) }); }
export const favoriteProductSchema = z.object({ id: z.string().cuid(), name: z.string(), slug: z.string(), priceCents: z.number().int().nullable(), image: z.object({ url: z.string(), alt: z.string() }).nullable(), available: z.boolean(), availabilityKnown: z.boolean() });
export const favoritesResponseSchema = z.object({ products: z.array(favoriteProductSchema).max(100), missingIds: favoriteIdsSchema });
export type FavoriteProduct = z.infer<typeof favoriteProductSchema>;
