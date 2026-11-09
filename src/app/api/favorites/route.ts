import { NextResponse } from "next/server";
import { favoriteIdsSchema } from "@/features/favorites/contracts";
import { toFavoriteProduct } from "@/features/favorites/service";
import { findPublishedProductsByIds } from "@/features/products/repository";
import { storeConfig } from "@/config/store";
import { readBoundedStream } from "@/lib/security/bounded-stream";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  let ids: string[];
  try {
    if (!request.body || !request.headers.get("content-type")?.startsWith("application/json")) throw new Error();
    const bytes = await readBoundedStream(request.body, 10000, request.signal, 10000);
    ids = favoriteIdsSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return NextResponse.json({ error: "invalid_favorites" }, { status: 400, headers }); }
  try {
    const products = ids.length ? await findPublishedProductsByIds(ids) : [];
    const byId = new Map(products.map(product => [product.id, product]));
    return NextResponse.json({ products: ids.flatMap(id => { const product = byId.get(id); return product ? [toFavoriteProduct(product, storeConfig.showPrices)] : []; }), missingIds: ids.filter(id => !byId.has(id)) }, { headers });
  } catch { return NextResponse.json({ error: "catalog_unavailable" }, { status: 503, headers }); }
}
