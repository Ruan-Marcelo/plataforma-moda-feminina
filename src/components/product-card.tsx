// RUAN MARCELO RAMACIOTI LUZ
import Link from "next/link";
import type { listPublishedProducts } from "@/features/products/repository";

type Product = Awaited<ReturnType<typeof listPublishedProducts>>["items"][number];

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const available = product.variants.some((variant) => variant.available);

  return (
    <li className="overflow-hidden rounded-belin-lg border border-nude bg-white">
      <Link href={`/produto/${product.slug}`} className="block rounded-belin-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-inset">
        <div className="aspect-[4/5] bg-nude">{image ? <img src={image.url} alt={image.alt} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted">Imagem ainda não cadastrada</div>}</div>
        <div className="p-4"><h3 className="font-display text-xl text-wine">{product.name}</h3>{product.priceCents !== null ? <p className="mt-2 text-sm">R$ {(product.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p> : <p className="mt-2 text-sm text-muted">Preço sob consulta</p>}<p className="mt-2 text-xs text-muted">{available ? "Disponibilidade cadastrada" : "Consulte disponibilidade"}</p></div>
      </Link>
    </li>
  );
}
