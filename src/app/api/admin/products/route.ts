// RUAN MARCELO RAMACIOTI LUZ
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/../auth";
import { canEditCatalog, createProductForStaff } from "@/features/products/admin-service";
import { listAdminProducts } from "@/features/products/repository";
import { productInputSchema } from "@/features/products/validation";
import { AuthenticationRequiredError, AuthorizationDeniedError } from "@/lib/auth/authorization";
import type { AuthenticatedUser } from "@/lib/auth/authorization";

const limitSchema = z.coerce.number().int().min(1).max(100).default(100);

export async function GET(request: Request) {
  try {
    const session = await auth();
    const actor: AuthenticatedUser | null = session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role } : null;
    if (!actor) throw new AuthenticationRequiredError();
    if (!canEditCatalog(actor.role)) throw new AuthorizationDeniedError();

    const parsedLimit = limitSchema.safeParse(new URL(request.url).searchParams.get("limit") ?? undefined);
    if (!parsedLimit.success) return NextResponse.json({ error: "invalid_limit" }, { status: 400 });

    const products = await listAdminProducts(parsedLimit.data);
    return NextResponse.json({
      items: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        status: product.status,
        priceCents: product.priceCents,
        categoryId: product.categoryId,
        collectionId: product.collectionId,
        variants: product.variants.map((variant) => ({ size: variant.size, color: variant.color, colorHex: variant.colorHex, available: variant.available })),
        variantCount: product.variants.length,
        imageCount: product.images.length,
        updatedAt: product.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "product_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const actor: AuthenticatedUser | null = session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role } : null;
    const body = await request.json().catch(() => null);
    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    const product = await createProductForStaff(actor, parsed.data);
    return NextResponse.json({ id: product.id, slug: product.slug }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "product_unavailable" }, { status: 503 });
  }
}
