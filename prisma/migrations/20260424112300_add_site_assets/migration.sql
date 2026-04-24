-- CreateEnum
CREATE TYPE "SiteAssetStatus" AS ENUM ('TEMPORARY', 'ATTACHED');

-- CreateEnum
CREATE TYPE "SiteAssetType" AS ENUM ('CATEGORY_IMAGE', 'RICH_TEXT_IMAGE');

-- CreateTable
CREATE TABLE "SiteAsset" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "SiteAssetType" NOT NULL,
    "status" "SiteAssetStatus" NOT NULL DEFAULT 'TEMPORARY',
    "url" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalName" TEXT,
    "originalSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
    "ownerType" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteAsset_url_key" ON "SiteAsset"("url");

-- CreateIndex
CREATE UNIQUE INDEX "SiteAsset_storagePath_key" ON "SiteAsset"("storagePath");

-- CreateIndex
CREATE INDEX "SiteAsset_shopId_type_status_idx" ON "SiteAsset"("shopId", "type", "status");

-- CreateIndex
CREATE INDEX "SiteAsset_userId_idx" ON "SiteAsset"("userId");

-- CreateIndex
CREATE INDEX "SiteAsset_ownerType_ownerId_idx" ON "SiteAsset"("ownerType", "ownerId");

-- AddForeignKey
ALTER TABLE "SiteAsset" ADD CONSTRAINT "SiteAsset_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAsset" ADD CONSTRAINT "SiteAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
