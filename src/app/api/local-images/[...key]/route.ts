import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db/prisma";
import { LocalObjectStorage, localCatalogImageRoot } from "@/lib/storage/local-object-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (env.STORAGE_DRIVER !== "local" || env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const key = (await params).key.join("/");
    const storage = new LocalObjectStorage(localCatalogImageRoot());
    const image = await prisma.productImage.findFirst({ where: { storageKey: key }, select: { id: true } });
    if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const stored = await storage.read(key);
    return new NextResponse(stored.body, {
      headers: { "Content-Type": stored.contentType, "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ZodError || (error instanceof Error && "code" in error && error.code === "ENOENT")) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "image_unavailable" }, { status: 503 });
  }
}
