// RUAN MARCELO RAMACIOTI LUZ
import { createDatabaseClient } from "../src/lib/db/client";

const prisma = createDatabaseClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("O seed de desenvolvimento não pode ser executado em produção.");

  const category = await prisma.category.upsert({ where: { slug: "sem-categoria" }, update: {}, create: { name: "Sem categoria", slug: "sem-categoria" } });
  const collection = await prisma.collection.upsert({ where: { slug: "demo-editorial" }, update: {}, create: { name: "Demo Editorial", slug: "demo-editorial", description: "Conteúdo de demonstração para desenvolvimento." } });
  const examples = [
    { slug: "demo-blusa-bordo", name: "Demo — Blusa Bordô", description: "Peça de demonstração para conhecer a experiência BÉLIN. Não representa um produto comercial real.\n\nUse este exemplo para alternar entre vistas e selecionar cores e tamanhos. As imagens são ilustrações identificadas como exemplo, e o preço é demonstrativo. A combinação Bordô / M está indisponível para testar o seletor.", priceCents: 15990, variants: [{ size: "P", color: "Bordô", colorHex: "#8D263B", available: true }, { size: "M", color: "Bordô", colorHex: "#8D263B", available: false }, { size: "G", color: "Bordô", colorHex: "#8D263B", available: true }, { size: "M", color: "Preto", colorHex: "#1D1C1A", available: true }] },
    { slug: "demo-saia-midi", name: "Demo — Saia Midi", description: "Peça de demonstração, sem oferta comercial real.\n\nAs duas vistas são ilustrações de exemplo, e o preço é demonstrativo. Selecione um tamanho para conferir a identificação encaminhada ao provador.", priceCents: 21990, variants: [{ size: "M", color: "Preto", colorHex: "#1D1C1A", available: true }, { size: "G", color: "Preto", colorHex: "#1D1C1A", available: true }] },
    { slug: "demo-peca-indisponivel", name: "Demo — Peça indisponível", description: "Exemplo criado apenas para verificar a apresentação de uma peça sem fotografias e com todas as variantes indisponíveis. Não representa uma oferta comercial.", priceCents: null, variants: [{ size: "M", color: "Nude", colorHex: "#E8D8C4", available: false }] },
  ];

  for (const example of examples) {
    const product = await prisma.product.upsert({
      where: { slug: example.slug },
      update: { name: example.name, description: example.description, priceCents: example.priceCents, status: "PUBLISHED", categoryId: category.id, collectionId: collection.id, variants: { deleteMany: {}, create: example.variants } },
      create: { ...example, status: "PUBLISHED", categoryId: category.id, collectionId: collection.id, variants: { create: example.variants } },
    });
    const images = example.slug === "demo-blusa-bordo" ? ["blusa-frente", "blusa-costas"] : example.slug === "demo-saia-midi" ? ["saia-frente", "saia-costas"] : [];
    for (const [sortOrder, name] of images.entries()) {
      const url = `/demo/${name}.svg`;
      const exists = await prisma.productImage.findFirst({ where: { productId: product.id, url } });
      if (!exists) await prisma.productImage.create({ data: { productId: product.id, url, alt: `${example.name} — ilustração de demonstração, ${sortOrder === 0 ? "frente" : "costas"}`, sortOrder } });
    }
  }
  console.log("Seed de desenvolvimento concluído: exemplos demo criados ou sincronizados. Não usar em produção.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
