// RUAN MARCELO RAMACIOTI LUZ
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireCatalogEditor, type AuthenticatedUser } from "@/lib/auth/authorization";
import { createProduct, deleteProduct, updateProduct } from "./repository";
import type { ProductInput } from "./validation";

export async function createProductForStaff(actor: AuthenticatedUser | null | undefined, input: ProductInput) {
  const authorizedActor = requireCatalogEditor(actor);
  return prisma.$transaction(async tx => {
    const product = await createProduct(input, tx);
    await tx.auditLog.create({ data: { actorId: authorizedActor.id, action: "product.create", entity: "Product", entityId: product.id } });
    return product;
  });
}

export async function updateProductForStaff(actor: AuthenticatedUser | null | undefined, id: string, input: ProductInput) {
  const authorizedActor = requireCatalogEditor(actor);
  return prisma.$transaction(async tx => {
    const product = await updateProduct(id, input, tx);
    await tx.auditLog.create({ data: { actorId: authorizedActor.id, action: "product.update", entity: "Product", entityId: product.id } });
    return product;
  });
}

export async function deleteProductForStaff(actor: AuthenticatedUser | null | undefined, id: string, confirmed: boolean) {
  const authorizedActor = requireCatalogEditor(actor);
  if (!confirmed) throw new Error("Deletion confirmation is required");
  return prisma.$transaction(async tx => {
    const product = await deleteProduct(id, tx);
    await tx.auditLog.create({ data: { actorId: authorizedActor.id, action: "product.delete", entity: "Product", entityId: product.id } });
    return product;
  });
}

export function canEditCatalog(role: Role) {
  return role === Role.ADMIN || role === Role.EDITOR;
}
