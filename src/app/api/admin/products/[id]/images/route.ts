// RUAN MARCELO RAMACIOTI LUZ
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/../auth";
import { requireCatalogEditor, AuthenticationRequiredError, AuthorizationDeniedError, type AuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { createProductImageKey, getObjectStorage, ObjectStorageNotConfiguredError } from "@/lib/storage/object-storage";
import { hasSupportedImageSignature, maxVirtualTryOnFileSize, supportedVirtualTryOnMimeTypes } from "@/features/virtual-fitting/validation";
import { normalizeFittingImage, FittingImageError } from "@/features/virtual-fitting/server-image";
import { BoundedStreamError, readBoundedStream } from "@/lib/security/bounded-stream";

type Params = { params: Promise<{ id: string }> };
const imageMetadataSchema = z.object({ alt: z.string().trim().min(1).max(160) });
const maxImageRequestBytes = maxVirtualTryOnFileSize + 256 * 1024;

function actorFromSession(session: Session | null): AuthenticatedUser | null {
  return session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role } : null;
}

export async function POST(request: Request, { params }: Params) {
  let uploadedKey: string | undefined;
  try {
    const actor = actorFromSession(await auth());
    requireCatalogEditor(actor);
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > maxImageRequestBytes) return NextResponse.json({ error: "request_too_large" }, { status: 413 });
    const { id } = await params;
    if (!z.string().cuid().safeParse(id).success) return NextResponse.json({ error: "invalid_product_id" }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!request.body) return NextResponse.json({ error: "invalid_image" }, { status: 400 });
    const body = await readBoundedStream(request.body, maxImageRequestBytes, request.signal);
    let formData: FormData;
    try { formData = await new Request(request.url, { method: "POST", headers: { "content-type": request.headers.get("content-type") ?? "" }, body }).formData(); }
    catch { return NextResponse.json({ error: "invalid_image" }, { status: 400 }); }
    const file = formData.get("file");
    const parsedFile = file instanceof File ? file : null;
    const parsedMetadata = imageMetadataSchema.safeParse({ alt: formData.get("alt") });
    if (!parsedFile || !parsedMetadata.success || formData.getAll("file").length !== 1 || formData.getAll("alt").length !== 1) return NextResponse.json({ error: "invalid_image" }, { status: 400 });
    if (!supportedVirtualTryOnMimeTypes.includes(parsedFile.type as (typeof supportedVirtualTryOnMimeTypes)[number]) || parsedFile.size <= 0 || parsedFile.size > maxVirtualTryOnFileSize) {
      return NextResponse.json({ error: "invalid_image" }, { status: 400 });
    }
    const bytes = new Uint8Array(await parsedFile.slice(0, 16).arrayBuffer());
    if (!hasSupportedImageSignature(bytes, parsedFile.type)) return NextResponse.json({ error: "invalid_image" }, { status: 400 });

    const normalized = await normalizeFittingImage(new Uint8Array(await parsedFile.arrayBuffer()), parsedFile.type);
    const storage = getObjectStorage();
    const key = createProductImageKey(id, "jpg");
    uploadedKey = key;
    const stored = await storage.put({ key, body: normalized.bytes, contentType: normalized.mimeType });
    const nextOrder = await prisma.productImage.count({ where: { productId: id } });
    const image = await prisma.productImage.create({ data: { productId: id, url: stored.url, storageKey: stored.key, alt: parsedMetadata.data.alt, sortOrder: nextOrder } });
    await prisma.auditLog.create({ data: { actorId: actor!.id, action: "product.image.create", entity: "ProductImage", entityId: image.id } });
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    if (uploadedKey) {
      try { await getObjectStorage().delete(uploadedKey); } catch { /* best effort cleanup */ }
    }
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof FittingImageError) return NextResponse.json({ error: "invalid_image" }, { status: 400 });
    if (error instanceof BoundedStreamError) return NextResponse.json({ error: error.code }, { status: error.code === "request_too_large" ? 413 : error.code === "timeout" ? 408 : 400 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (error instanceof ObjectStorageNotConfiguredError) return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
    if (error instanceof Prisma.PrismaClientKnownRequestError) return NextResponse.json({ error: "image_unavailable" }, { status: 503 });
    return NextResponse.json({ error: "image_unavailable" }, { status: 503 });
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const actor = actorFromSession(await auth());
    requireCatalogEditor(actor);
    const { id } = await params;
    if (!z.string().cuid().safeParse(id).success) return NextResponse.json({ error: "invalid_product_id" }, { status: 400 });
    const images = await prisma.productImage.findMany({ where: { productId: id }, orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true, sortOrder: true } });
    return NextResponse.json({ items: images });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "images_unavailable" }, { status: 503 });
  }
}
