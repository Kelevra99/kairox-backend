/*
  Warnings:

  - A unique constraint covering the columns `[shopId,sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopId,slug]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopId,key]` on the table `SiteTheme` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shopId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `SiteBanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `SiteTheme` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShopDomainType" AS ENUM ('PREVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DomainVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "TaxonomySource" AS ENUM ('MARKETPLACE', 'OZON');

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "Product_slug_key";

-- DropIndex
DROP INDEX "SiteBanner_key_position_idx";

-- DropIndex
DROP INDEX "SiteTheme_key_key";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "marketplaceCategoryId" TEXT,
ADD COLUMN     "shopId" TEXT,
ADD COLUMN     "siteCategoryId" TEXT,
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SiteBanner" ADD COLUMN     "shopId" TEXT;

-- AlterTable
ALTER TABLE "SiteTheme" ADD COLUMN     "shopId" TEXT;

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "previewSubdomain" TEXT NOT NULL,
    "status" "ShopStatus" NOT NULL DEFAULT 'DRAFT',
    "isPreviewProtected" BOOLEAN NOT NULL DEFAULT true,
    "previewAccessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopDomain" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "type" "ShopDomainType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "DomainVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceTaxonomyMeta" (
    "id" TEXT NOT NULL,
    "source" "TaxonomySource" NOT NULL,
    "taxonomyVersion" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceTaxonomyMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceCategory" (
    "id" TEXT NOT NULL,
    "source" "TaxonomySource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "fullPath" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "isLeaf" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteCategory" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "parentId" TEXT,
    "mappedMarketplaceCategoryId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteCategory_pkey" PRIMARY KEY ("id")
);

-- Seed default shop for legacy single-store data
INSERT INTO "Shop" (
    "id",
    "name",
    "slug",
    "previewSubdomain",
    "status",
    "isPreviewProtected",
    "previewAccessToken",
    "createdAt",
    "updatedAt"
)
SELECT
    'default-store-shop',
    'KaiRox Default Store',
    'default-store',
    'default-store-preview',
    'DRAFT'::"ShopStatus",
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "Shop" WHERE "slug" = 'default-store'
);

INSERT INTO "ShopDomain" (
    "id",
    "shopId",
    "host",
    "type",
    "isPrimary",
    "verificationStatus",
    "createdAt",
    "updatedAt"
)
SELECT
    'default-store-domain',
    'default-store-shop',
    'default-store-preview.localhost',
    'PREVIEW'::"ShopDomainType",
    true,
    'VERIFIED'::"DomainVerificationStatus",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "ShopDomain" WHERE "host" = 'default-store-preview.localhost'
);

-- Backfill legacy single-store rows to the default shop
UPDATE "SiteTheme"
SET "shopId" = 'default-store-shop'
WHERE "shopId" IS NULL;

UPDATE "SiteBanner"
SET "shopId" = 'default-store-shop'
WHERE "shopId" IS NULL;

UPDATE "Product"
SET "shopId" = 'default-store-shop'
WHERE "shopId" IS NULL;

-- Make shopId required after backfill
ALTER TABLE "Product" ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "SiteBanner" ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "SiteTheme" ALTER COLUMN "shopId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_previewSubdomain_key" ON "Shop"("previewSubdomain");

-- CreateIndex
CREATE UNIQUE INDEX "ShopDomain_host_key" ON "ShopDomain"("host");

-- CreateIndex
CREATE INDEX "ShopDomain_shopId_type_idx" ON "ShopDomain"("shopId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceTaxonomyMeta_source_key" ON "MarketplaceTaxonomyMeta"("source");

-- CreateIndex
CREATE INDEX "MarketplaceCategory_source_parentId_idx" ON "MarketplaceCategory"("source", "parentId");

-- CreateIndex
CREATE INDEX "MarketplaceCategory_source_title_idx" ON "MarketplaceCategory"("source", "title");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCategory_source_externalId_key" ON "MarketplaceCategory"("source", "externalId");

-- CreateIndex
CREATE INDEX "SiteCategory_shopId_parentId_sortOrder_idx" ON "SiteCategory"("shopId", "parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "SiteCategory_mappedMarketplaceCategoryId_idx" ON "SiteCategory"("mappedMarketplaceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteCategory_shopId_slug_key" ON "SiteCategory"("shopId", "slug");

-- CreateIndex
CREATE INDEX "Product_shopId_status_createdAt_idx" ON "Product"("shopId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_siteCategoryId_idx" ON "Product"("siteCategoryId");

-- CreateIndex
CREATE INDEX "Product_marketplaceCategoryId_idx" ON "Product"("marketplaceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_sku_key" ON "Product"("shopId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_slug_key" ON "Product"("shopId", "slug");

-- CreateIndex
CREATE INDEX "SiteBanner_shopId_key_position_idx" ON "SiteBanner"("shopId", "key", "position");

-- CreateIndex
CREATE INDEX "SiteTheme_shopId_idx" ON "SiteTheme"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteTheme_shopId_key_key" ON "SiteTheme"("shopId", "key");

-- AddForeignKey
ALTER TABLE "ShopDomain" ADD CONSTRAINT "ShopDomain_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceCategory" ADD CONSTRAINT "MarketplaceCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MarketplaceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCategory" ADD CONSTRAINT "SiteCategory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCategory" ADD CONSTRAINT "SiteCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SiteCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCategory" ADD CONSTRAINT "SiteCategory_mappedMarketplaceCategoryId_fkey" FOREIGN KEY ("mappedMarketplaceCategoryId") REFERENCES "MarketplaceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_siteCategoryId_fkey" FOREIGN KEY ("siteCategoryId") REFERENCES "SiteCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_marketplaceCategoryId_fkey" FOREIGN KEY ("marketplaceCategoryId") REFERENCES "MarketplaceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteTheme" ADD CONSTRAINT "SiteTheme_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteBanner" ADD CONSTRAINT "SiteBanner_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
