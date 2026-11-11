CREATE TABLE "StorageDeletionTask" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseToken" TEXT,
    "completedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StorageDeletionTask_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StorageDeletionTask_storageKey_key" ON "StorageDeletionTask"("storageKey");
CREATE INDEX "StorageDeletionTask_driver_completedAt_nextAttemptAt_idx" ON "StorageDeletionTask"("driver", "completedAt", "nextAttemptAt");
