-- RUAN MARCELO RAMACIOTI LUZ
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'CLIENTE');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "User" ("id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT, "role" "Role" NOT NULL DEFAULT 'CLIENTE', "emailVerified" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Category" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Category_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Collection" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Collection_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Product" ("id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "priceCents" INTEGER, "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT', "categoryId" TEXT, "collectionId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Product_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ProductImage" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "url" TEXT NOT NULL, "alt" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ProductVariant" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "size" TEXT NOT NULL, "color" TEXT NOT NULL, "colorHex" TEXT, "available" BOOLEAN NOT NULL DEFAULT true, CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ProductMeasurement" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "bustCm" DECIMAL(5,2), "waistCm" DECIMAL(5,2), "hipCm" DECIMAL(5,2), "lengthCm" DECIMAL(5,2), CONSTRAINT "ProductMeasurement_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StoreSetting" ("key" TEXT NOT NULL, "value" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("key"));
CREATE TABLE "AnalyticsEvent" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "anonymousId" TEXT NOT NULL, "productId" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id"));
CREATE TABLE "AuditLog" ("id" TEXT NOT NULL, "actorId" TEXT NOT NULL, "action" TEXT NOT NULL, "entity" TEXT NOT NULL, "entityId" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_collectionId_idx" ON "Product"("collectionId");
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");
CREATE INDEX "ProductVariant_productId_available_idx" ON "ProductVariant"("productId", "available");
CREATE UNIQUE INDEX "ProductVariant_productId_size_color_key" ON "ProductVariant"("productId", "size", "color");
CREATE UNIQUE INDEX "ProductMeasurement_productId_key" ON "ProductMeasurement"("productId");
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");
CREATE INDEX "AnalyticsEvent_anonymousId_createdAt_idx" ON "AnalyticsEvent"("anonymousId", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductMeasurement" ADD CONSTRAINT "ProductMeasurement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
