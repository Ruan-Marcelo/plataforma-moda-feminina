// RUAN MARCELO RAMACIOTI LUZ
export function createWhatsAppLink(number: string, productName?: string, productUrl?: string): string {
  if (!/^\d{10,15}$/.test(number)) throw new Error("Número de WhatsApp inválido");

  const product = productName ? ` Tenho interesse no produto ${productName}.` : "";
  const url = productUrl ? ` Link: ${productUrl}` : "";
  const message = `Olá!${product} Poderia me informar mais sobre tamanhos, cores e disponibilidade?${url}`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
