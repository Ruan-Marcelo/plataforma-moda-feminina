// RUAN MARCELO RAMACIOTI LUZ
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/../auth";
import { AuthenticationRequiredError, AuthorizationDeniedError, requireCatalogEditor, type AuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { enqueueStorageDeletions, attemptStorageDeletions } from "@/lib/storage/deletion-tasks";

type Params = { params: Promise<{ id: string; imageId: string }> };
function actorFromSession(session: Session | null): AuthenticatedUser | null { return session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role } : null; }

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const actor = actorFromSession(await auth());
    requireCatalogEditor(actor);
    const { id, imageId } = await params;
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
    if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const keys = await prisma.$transaction(async tx => {
      const queued = await enqueueStorageDeletions(tx, image.storageKey ? [image.storageKey] : []);
      await tx.productImage.delete({ where: { id: image.id } });
      await tx.auditLog.create({ data: { actorId: actor!.id, action: "product.image.delete", entity: "ProductImage", entityId: image.id } });
      return queued;
    });
    await attemptStorageDeletions(keys);
    return NextResponse.json({ id: image.id });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "image_unavailable" }, { status: 503 });
  }
}
