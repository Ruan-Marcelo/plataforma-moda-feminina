import { prisma } from "../src/lib/db/prisma";
import { processStorageDeletions } from "../src/lib/storage/deletion-tasks";

async function main() {
  if (!process.argv.includes("--execute")) {
    const pending = await prisma.storageDeletionTask.count({ where: { completedAt: null } });
    console.log(JSON.stringify({ pending, dryRun: true, instruction: "Use --execute to retry at most 20 recorded catalog deletions." }));
    return;
  }
  console.log(JSON.stringify(await processStorageDeletions()));
}
main().catch(() => { console.error("storage_reconciliation_failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
