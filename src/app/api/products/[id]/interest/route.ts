import { NextResponse } from "next/server";
import { storeConfig } from "@/config/store";
import { createProductInterestLink } from "@/features/products/interest";
import { findPublishedProductById } from "@/features/products/repository";
import { findAvailableVariant, productSelectionSchema } from "@/features/products/selection";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const search = new URL(request.url).searchParams;
  const parsed = productSelectionSchema.safeParse({ productId: (await params).id, variantId: search.get("variantId") });
  if (!parsed.success || search.getAll("variantId").length !== 1) {
    return NextResponse.json({ error: "invalid_selection" }, { status: 400 });
  }
  try {
    const product = await findPublishedProductById(parsed.data.productId);
    if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const variant = findAvailableVariant(product.variants, parsed.data.variantId);
    if (!variant) {
      return NextResponse.redirect(new URL(`/produto/${product.slug}?selection=unavailable`, request.url), 303);
    }
    if (!storeConfig.whatsappNumber) return NextResponse.json({ error: "whatsapp_not_configured" }, { status: 503 });
    const destination = createProductInterestLink({
      number: storeConfig.whatsappNumber,
      product: { id: product.id, name: product.name, slug: product.slug, url: `${storeConfig.appUrl}/produto/${product.slug}` },
      variant: { id: variant.id, color: variant.color, size: variant.size, available: true },
    });
    return NextResponse.redirect(destination, { status: 303, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "selection_unavailable" }, { status: 503 });
  }
}
