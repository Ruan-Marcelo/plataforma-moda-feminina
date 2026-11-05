// RUAN MARCELO RAMACIOTI LUZ
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("O seed de desenvolvimento não pode ser executado em produção.");

  const category = await prisma.category.upsert({ where: { slug: "sem-categoria" }, update: {}, create: { name: "Sem categoria", slug: "sem-categoria" } });
  const collection = await prisma.collection.upsert({ where: { slug: "demo-editorial" }, update: {}, create: { name: "Demo Editorial", slug: "demo-editorial", description: "Conteúdo de demonstração para desenvolvimento." } });
  const examples = [
    { slug: "demo-blusa-bordo", name: "Demo — Blusa Bordô", description: "Exemplo de produto para validar catálogo, filtros e paginação.", priceCents: 15990, variants: [{ size: "P", color: "Bordô", colorHex: "#8D263B" }, { size: "M", color: "Bordô", colorHex: "#8D263B" }] },
    { slug: "demo-saia-midi", name: "Demo — Saia Midi", description: "Exemplo sem imagem, para não inventar fotografia comercial.", priceCents: 21990, variants: [{ size: "M", color: "Preto", colorHex: "#1D1C1A" }, { size: "G", color: "Preto", colorHex: "#1D1C1A" }] },
  ];

  for (const example of examples) {
    await prisma.product.upsert({
      where: { slug: example.slug },
      update: { name: example.name, description: example.description, priceCents: example.priceCents, status: "PUBLISHED", categoryId: category.id, collectionId: collection.id, variants: { deleteMany: {}, create: example.variants } },
      create: { ...example, status: "PUBLISHED", categoryId: category.id, collectionId: collection.id, variants: { create: example.variants } },
    });
  }
  console.log("Seed de desenvolvimento concluído: exemplos demo criados ou sincronizados. Não usar em produção.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
