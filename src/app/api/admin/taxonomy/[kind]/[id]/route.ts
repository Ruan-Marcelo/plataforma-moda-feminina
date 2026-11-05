// RUAN MARCELO RAMACIOTI LUZ
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/../auth";
import { AuthenticationRequiredError, AuthorizationDeniedError, requireCatalogEditor, type AuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ kind: string; id: string }> };
const kindSchema = z.enum(["category", "collection"]);

function actorFromSession(session: Session | null): AuthenticatedUser | null { return session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role } : null; }

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const actor = actorFromSession(await auth());
    requireCatalogEditor(actor);
    const { kind, id } = await params;
    const parsedKind = kindSchema.safeParse(kind);
    if (!parsedKind.success || !z.string().cuid().safeParse(id).success) return NextResponse.json({ error: "invalid_taxonomy_id" }, { status: 400 });
    if (parsedKind.data === "category") await prisma.category.delete({ where: { id } });
    else await prisma.collection.delete({ where: { id } });
    await prisma.auditLog.create({ data: { actorId: actor!.id, action: `taxonomy.${parsedKind.data}.delete`, entity: parsedKind.data === "category" ? "Category" : "Collection", entityId: id } });
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "taxonomy_unavailable" }, { status: 503 });
  }
}
