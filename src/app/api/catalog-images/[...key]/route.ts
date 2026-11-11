import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db/prisma";
import { getObjectStorage } from "@/lib/storage/object-storage";
import { catalogImageIsReadable } from "@/features/virtual-fitting/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
const missing = () => NextResponse.json({ error: "not_found" }, { status: 404, headers });

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const parts = (await params).key;
  const key = parts.join("/");
  if (!catalogImageIsReadable(parts[1] ?? "", key)) return missing();
  try {
    const image = await prisma.productImage.findFirst({ where: { storageKey: key }, select: { id: true, product: { select: { status: true } } } });
    if (!image) return missing();
    if (image.product.status !== "PUBLISHED") {
      const session = await auth();
      if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) return missing();
    }
    const stored = await getObjectStorage().read(key, request.signal);
    if (!["image/jpeg", "image/png", "image/webp"].includes(stored.contentType)) return missing();
    return new NextResponse(new Uint8Array(stored.body), { headers: { ...headers, "Content-Type": stored.contentType } });
  } catch (error) {
    if (error instanceof Error && "code" in error && ["ENOENT", "NoSuchKey"].includes(String(error.code))) return missing();
    return NextResponse.json({ error: "image_unavailable" }, { status: 503, headers });
  }
}
