// RUAN MARCELO RAMACIOTI LUZ
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/../auth";
import { deleteProductForStaff, updateProductForStaff } from "@/features/products/admin-service";
import { productInputSchema } from "@/features/products/validation";
import { AuthenticationRequiredError, AuthorizationDeniedError } from "@/lib/auth/authorization";
import type { AuthenticatedUser } from "@/lib/auth/authorization";

type Params = { params: Promise<{ id: string }> };
const productIdSchema = z.string().cuid();
const deleteConfirmationSchema = z.object({ confirm: z.literal(true) });

function actorFromSession(session: Session | null): AuthenticatedUser | null {
  return session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role } : null;
}

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const actor = actorFromSession(await auth());
    const { id } = await params;
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "invalid_product_id" }, { status: 400 });
    const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    const product = await updateProductForStaff(actor, parsedId.data, parsed.data);
    return NextResponse.json({ id: product.id, slug: product.slug });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (isNotFound(error)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "product_unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const actor = actorFromSession(await auth());
    const { id } = await params;
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "invalid_product_id" }, { status: 400 });
    const body = await request.json().catch(() => null);
    const confirmed = deleteConfirmationSchema.safeParse(body).success;
    const product = await deleteProductForStaff(actor, parsedId.data, confirmed);
    return NextResponse.json({ id: product.id });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (error instanceof Error && error.message === "Deletion confirmation is required") return NextResponse.json({ error: "confirmation_required" }, { status: 400 });
    if (isNotFound(error)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "product_unavailable" }, { status: 503 });
  }
}
