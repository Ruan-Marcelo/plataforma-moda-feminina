import { createDatabaseClient } from "../src/lib/db/client";

const prisma = createDatabaseClient();
async function main() {
  const deleted = await prisma.virtualFittingOperation.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  console.log(`Metadados expirados removidos: ${deleted.count}. Nenhuma fotografia é armazenada nesta tabela.`);
}
main().catch(() => { console.error("Falha ao remover metadados expirados; nenhuma credencial foi exibida."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
