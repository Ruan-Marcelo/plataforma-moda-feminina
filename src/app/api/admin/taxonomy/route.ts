// RUAN MARCELO RAMACIOTI LUZ
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/../auth";
import { AuthenticationRequiredError, AuthorizationDeniedError, requireCatalogEditor, type AuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { readBoundedJson, bodyLimitResponse } from "@/lib/security/request-body";

const taxonomyInputSchema = z.object({
  kind: z.enum(["category", "collection"]),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  description: z.string().trim().max(2000).optional(),
});

function actorFromSession(session: Session | null): AuthenticatedUser | null { return session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role } : null; }

export async function GET() {
  try {
    requireCatalogEditor(actorFromSession(await auth()));
    const [categories, collections] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
      prisma.collection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, description: true } }),
    ]);
    return NextResponse.json({ categories, collections });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "taxonomy_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = actorFromSession(await auth());
    requireCatalogEditor(actor);
    const parsed = taxonomyInputSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) return NextResponse.json({ error: "invalid_taxonomy" }, { status: 400 });
    const item = await prisma.$transaction(async tx => {
      const created = parsed.data.kind === "category"
        ? await tx.category.create({ data: { name: parsed.data.name, slug: parsed.data.slug } })
        : await tx.collection.create({ data: { name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description } });
      await tx.auditLog.create({ data: { actorId: actor!.id, action: `taxonomy.${parsed.data.kind}.create`, entity: parsed.data.kind === "category" ? "Category" : "Collection", entityId: created.id } });
      return created;
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const limited = bodyLimitResponse(error); if (limited) return limited;
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "slug_already_exists" }, { status: 409 });
    return NextResponse.json({ error: "taxonomy_unavailable" }, { status: 503 });
  }
}
