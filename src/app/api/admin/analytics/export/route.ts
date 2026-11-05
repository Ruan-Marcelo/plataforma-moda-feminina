// RUAN MARCELO RAMACIOTI LUZ
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/../auth";
import { AuthenticationRequiredError, AuthorizationDeniedError, requireCatalogEditor, type AuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

const daysSchema = z.coerce.number().int().refine((value): value is 7 | 30 | 90 => value === 7 || value === 30 || value === 90, "Invalid period");
function actorFromSession(session: Session | null): AuthenticatedUser | null { return session?.user?.id && session.user.role ? { id: session.user.id, role: session.user.role } : null; }
function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export async function GET(request: Request) {
  try {
    requireCatalogEditor(actorFromSession(await auth()));
    const parsedDays = daysSchema.safeParse(new URL(request.url).searchParams.get("days") ?? "7");
    if (!parsedDays.success) return NextResponse.json({ error: "invalid_period" }, { status: 400 });
    const since = new Date(Date.now() - parsedDays.data * 24 * 60 * 60 * 1000);
    const grouped = await prisma.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { name: "asc" } });
    const rows = [["evento", "quantidade", "desde", "periodo_dias"], ...grouped.map((item) => [item.name, item._count._all, since.toISOString(), parsedDays.data])];
    const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\r\n");
    return new NextResponse(`${csv}\r\n`, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="belin-analytics-${parsedDays.data}d.csv"`, "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    if (error instanceof AuthorizationDeniedError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  }
}
