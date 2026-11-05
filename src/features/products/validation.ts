// RUAN MARCELO RAMACIOTI LUZ
import { z } from "zod";

export const productStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const productVariantSchema = z.object({
  size: z.string().trim().min(1).max(30),
  color: z.string().trim().min(1).max(60),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  available: z.boolean().default(true),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  description: z.string().trim().max(5000).optional(),
  priceCents: z.number().int().nonnegative().optional(),
  status: productStatusSchema.default("DRAFT"),
  categoryId: z.string().cuid().optional(),
  collectionId: z.string().cuid().optional(),
  variants: z.array(productVariantSchema).max(100).default([]),
});

export type ProductInput = z.infer<typeof productInputSchema>;

function emptyQueryValue(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoryId: z.preprocess(emptyQueryValue, z.string().cuid().optional()),
  collectionId: z.preprocess(emptyQueryValue, z.string().cuid().optional()),
  size: z.string().trim().max(30).optional(),
  color: z.string().trim().max(60).optional(),
  availability: z.enum(["all", "available", "unavailable"]).default("all"),
  minPrice: z.preprocess(emptyQueryValue, z.coerce.number().int().nonnegative().optional()),
  maxPrice: z.preprocess(emptyQueryValue, z.coerce.number().int().nonnegative().optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(24),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
}).refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
  message: "minPrice must not exceed maxPrice",
  path: ["minPrice"],
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
