type Props = { configured: boolean; productId?: string; variantId?: string; href?: string; label?: string; className?: string };
export function StoreContact({ configured, productId, variantId, href, label = "Tenho interesse", className = "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-wine px-4 py-3 text-center text-sm text-wine hover:bg-cream" }: Props) {
  const destination = productId ? `/api/products/${encodeURIComponent(productId)}/interest${variantId ? `?${new URLSearchParams({ variantId })}` : ""}` : href;
  return configured && destination ? <a href={destination} target="_blank" rel="noopener noreferrer" className={className}>{label}</a> : <span className="block text-sm text-muted">WhatsApp ainda não configurado pela loja.</span>;
}
