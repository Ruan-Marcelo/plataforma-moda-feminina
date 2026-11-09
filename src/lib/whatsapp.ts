// RUAN MARCELO RAMACIOTI LUZ
export function createWhatsAppLink(number: string, productName?: string, productUrl?: string): string {
  if (!/^[1-9]\d{9,14}$/.test(number)) throw new Error("Número de WhatsApp inválido");
  if (productUrl) {
    const parsed = new URL(productUrl);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Link da peça inválido");
  }

  const product = productName ? ` Vi esta peça no site da BÉLIN e gostaria de saber mais sobre ela: ${productName}.` : " Gostaria de falar com a BÉLIN.";
  const url = productUrl ? ` Link: ${productUrl}` : "";
  const message = `Olá!${product} Poderia me informar mais sobre tamanhos, cores e disponibilidade?${url}`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
