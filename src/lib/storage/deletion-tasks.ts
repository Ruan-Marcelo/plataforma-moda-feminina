import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { catalogImageIsReadable } from "@/features/virtual-fitting/contracts";
import { getObjectStorage, type ObjectStorage } from "./object-storage";

function storageTarget() {
  const target = env.STORAGE_DRIVER === "local" ? path.resolve(process.cwd(), ".local-data", "catalog-images") : `${env.S3_ENDPOINT ?? "aws"}|${env.S3_REGION}|${env.S3_BUCKET ?? ""}`;
  return `${env.STORAGE_DRIVER}:${createHash("sha256").update(target).digest("hex")}`;
}

export async function enqueueStorageDeletions(tx: Prisma.TransactionClient, keys: string[]) {
  const unique = [...new Set(keys)];
  if (unique.length) {
    const driver = storageTarget();
    await tx.storageDeletionTask.createMany({ data: unique.map(storageKey => ({ storageKey, driver })), skipDuplicates: true });
    // A shared key may have remained referenced when an earlier cleanup completed.
    await tx.storageDeletionTask.updateMany({ where: { storageKey: { in: unique }, completedAt: { not: null } }, data: { driver, attempts: 0, nextAttemptAt: new Date(), leaseToken: null, completedAt: null, errorCode: null } });
  }
  return unique;
}

// An expired lease is retried after a crash. Object deletion is idempotent in both adapters.
export async function processStorageDeletions(options: { keys?: string[]; limit?: number; db?: PrismaClient; storage?: ObjectStorage } = {}) {
  const db = options.db ?? prisma;
  const now = new Date();
  const tasks = await db.storageDeletionTask.findMany({
    where: { driver: storageTarget(), completedAt: null, attempts: { lt: 8 }, nextAttemptAt: { lte: now }, ...(options.keys ? { storageKey: { in: options.keys } } : {}) },
    orderBy: { createdAt: "asc" }, take: Math.min(Math.max(options.limit ?? 20, 1), 100),
  });
  let completed = 0;
  let failed = 0;
  for (const task of tasks) {
    const leaseToken = randomUUID();
    const claimed = await db.storageDeletionTask.updateMany({ where: { id: task.id, completedAt: null, nextAttemptAt: { lte: now }, attempts: { lt: 8 } }, data: { leaseToken, attempts: { increment: 1 }, nextAttemptAt: new Date(now.getTime() + 120_000) } });
    if (!claimed.count) continue;
    const where = { id: task.id, leaseToken };
    try {
      if (!catalogImageIsReadable(task.storageKey.split("/")[1] ?? "", task.storageKey)) {
        await db.storageDeletionTask.updateMany({ where, data: { attempts: 8, errorCode: "invalid_storage_key", leaseToken: null } });
        failed++; continue;
      }
      // A live reference wins over cleanup; never delete a still-used object.
      if (!await db.productImage.count({ where: { storageKey: task.storageKey } })) await (options.storage ?? getObjectStorage()).delete(task.storageKey);
      await db.storageDeletionTask.updateMany({ where, data: { completedAt: new Date(), leaseToken: null, errorCode: null } });
      completed++;
    } catch {
      failed++;
      await db.storageDeletionTask.updateMany({ where, data: { leaseToken: null, errorCode: "storage_cleanup_failed", nextAttemptAt: new Date(Date.now() + Math.min(3_600_000, 60_000 * 2 ** task.attempts)) } });
    }
  }
  return { examined: tasks.length, completed, failed };
}

export async function attemptStorageDeletions(keys: string[]) {
  if (!keys.length) return;
  try { await processStorageDeletions({ keys }); }
  catch { /* Durable instructions remain in PostgreSQL; never turn a committed deletion into a false failure. */ }
}
