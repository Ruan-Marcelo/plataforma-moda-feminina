CREATE TABLE "VirtualFittingOperation" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "ownerHash" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "consentVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RESERVED',
  "providerRequestId" TEXT,
  "errorCode" TEXT,
  "reservedCredits" INTEGER NOT NULL CHECK ("reservedCredits" > 0),
  "actualCredits" INTEGER,
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VirtualFittingOperation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VirtualFittingOperation_requestId_key" ON "VirtualFittingOperation"("requestId");
CREATE INDEX "VirtualFittingOperation_createdAt_idx" ON "VirtualFittingOperation"("createdAt");
CREATE INDEX "VirtualFittingOperation_ownerHash_createdAt_idx" ON "VirtualFittingOperation"("ownerHash", "createdAt");
CREATE INDEX "VirtualFittingOperation_settledAt_idx" ON "VirtualFittingOperation"("settledAt");
CREATE INDEX "VirtualFittingOperation_expiresAt_idx" ON "VirtualFittingOperation"("expiresAt");
