// RUAN MARCELO RAMACIOTI LUZ
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { withCatalogImageUrls } from "@/lib/storage/catalog-image-url";
import { catalogQuerySchema, type CatalogQuery, type ProductInput } from "./validation";

const productInclude = { images: { orderBy: { sortOrder: "asc" as const } }, variants: true, measurement: true, category: true, collection: true } satisfies Prisma.ProductInclude;

export async function listPublishedProducts(input: Partial<CatalogQuery> = {}) {
  const query = catalogQuerySchema.parse(input);
  const variantFilter: Prisma.ProductVariantWhereInput = {
    ...(query.size ? { size: query.size } : {}),
    ...(query.color ? { color: query.color } : {}),
    ...(query.availability === "available" ? { available: true } : {}),
    ...(query.availability === "unavailable" ? { available: false } : {}),
  };
  const variantConditions: Prisma.ProductWhereInput[] = [];
  if (query.size || query.color || query.availability === "available") variantConditions.push({ variants: { some: variantFilter } });
  if (query.availability === "unavailable") {
    variantConditions.push({ variants: { none: { available: true } } });
  }
  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    ...(query.q ? { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { description: { contains: query.q, mode: "insensitive" } }] } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.collectionId ? { collectionId: query.collectionId } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined ? { priceCents: { gte: query.minPrice, lte: query.maxPrice } } : {}),
    ...(variantConditions.length ? { AND: variantConditions } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput = query.sort === "price_asc" ? { priceCents: "asc" } : query.sort === "price_desc" ? { priceCents: "desc" } : { createdAt: "desc" };
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({ where, include: productInclude, orderBy, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.product.count({ where }),
  ]);
  return { items: items.map(withCatalogImageUrls), total, page: query.page, pageSize: query.pageSize, pageCount: Math.ceil(total / query.pageSize), query };
}

export async function listAdminProducts(limit = 100) {
  const take = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const products = await prisma.product.findMany({
    include: productInclude,
    orderBy: { updatedAt: "desc" },
    take,
  });
  return products.map(withCatalogImageUrls);
}

export async function listAdminTaxonomy() {
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.collection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, description: true } }),
  ]);
  return { categories, collections };
}

export async function listPublishedCategories() {
  return prisma.category.findMany({
    where: { products: { some: { status: "PUBLISHED" } } },
    select: { id: true, name: true, slug: true, _count: { select: { products: { where: { status: "PUBLISHED" } } } } },
    orderBy: { name: "asc" },
  });
}

export async function findPublishedProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug, status: "PUBLISHED" }, include: productInclude });
  return product ? withCatalogImageUrls(product) : null;
}

export async function findPublishedProductById(id: string) {
  const product = await prisma.product.findFirst({ where: { id, status: "PUBLISHED" }, include: productInclude });
  return product ? withCatalogImageUrls(product) : null;
}

export async function findPublishedProductsByIds(ids: string[]) {
  const products = await prisma.product.findMany({ where: { id: { in: ids }, status: "PUBLISHED" }, include: productInclude, take: 100 });
  return products.map(withCatalogImageUrls);
}

export async function listRelatedPublishedProducts(productId: string, categoryId?: string | null, collectionId?: string | null, take = 4) {
  const relationFilters: Prisma.ProductWhereInput[] = [];
  if (categoryId) relationFilters.push({ categoryId });
  if (collectionId) relationFilters.push({ collectionId });
  if (!relationFilters.length) return [];
  const products = await prisma.product.findMany({ where: { status: "PUBLISHED", id: { not: productId }, OR: relationFilters }, include: productInclude, orderBy: { createdAt: "desc" }, take: Math.min(Math.max(take, 1), 8) });
  return products.map(withCatalogImageUrls);
}

export async function createProduct(input: ProductInput, db: Prisma.TransactionClient = prisma) {
  return db.product.create({ data: { name: input.name, slug: input.slug, description: input.description, priceCents: input.priceCents, status: input.status, categoryId: input.categoryId, collectionId: input.collectionId, variants: { create: input.variants } }, include: productInclude });
}

export async function updateProduct(id: string, input: ProductInput, db: Prisma.TransactionClient = prisma) {
  return db.product.update({ where: { id }, data: { name: input.name, slug: input.slug, description: input.description, priceCents: input.priceCents, status: input.status, categoryId: input.categoryId, collectionId: input.collectionId, variants: { deleteMany: {}, create: input.variants } }, include: productInclude });
}

export async function deleteProduct(id: string, db: Prisma.TransactionClient = prisma) {
  return db.product.delete({ where: { id } });
}
