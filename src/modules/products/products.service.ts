import { Injectable } from "@nestjs/common";
import { Prisma, TaxonomySource, ShopStatus, ShopDomainType, DomainVerificationStatus } from "@prisma/client";
import { PrismaService } from "@/modules/prisma/prisma.service";
import {
  defaultShopSeed,
  defaultShopDomainSeed,
  marketplaceTaxonomyMetaSeed,
  marketplaceCategoriesSeed,
  siteCategoriesSeed,
  products as seedProducts,
  reviews
} from "@/shared/mock-data/store.seed";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureDefaultShop() {
    const shop = await this.prisma.shop.upsert({
      where: { slug: defaultShopSeed.slug },
      update: {},
      create: {
        name: defaultShopSeed.name,
        slug: defaultShopSeed.slug,
        previewSubdomain: defaultShopSeed.previewSubdomain,
        status: ShopStatus[defaultShopSeed.status as keyof typeof ShopStatus],
        isPreviewProtected: defaultShopSeed.isPreviewProtected,
        previewAccessToken: defaultShopSeed.previewAccessToken
      }
    });

    const existingDomain = await this.prisma.shopDomain.findUnique({
      where: { host: defaultShopDomainSeed.host }
    });

    if (!existingDomain) {
      await this.prisma.shopDomain.create({
        data: {
          shopId: shop.id,
          host: defaultShopDomainSeed.host,
          type: ShopDomainType[defaultShopDomainSeed.type as keyof typeof ShopDomainType],
          isPrimary: defaultShopDomainSeed.isPrimary,
          verificationStatus:
            DomainVerificationStatus[
              defaultShopDomainSeed.verificationStatus as keyof typeof DomainVerificationStatus
            ]
        }
      });
    }

    return shop;
  }

  private async ensureMarketplaceTaxonomySeed() {
    await this.prisma.marketplaceTaxonomyMeta.upsert({
      where: {
        source:
          TaxonomySource[
            marketplaceTaxonomyMetaSeed.source as keyof typeof TaxonomySource
          ]
      },
      update: {
        taxonomyVersion: marketplaceTaxonomyMetaSeed.taxonomyVersion,
        checksum: marketplaceTaxonomyMetaSeed.checksum,
        syncedAt: marketplaceTaxonomyMetaSeed.syncedAt
          ? new Date(marketplaceTaxonomyMetaSeed.syncedAt)
          : null
      },
      create: {
        source:
          TaxonomySource[
            marketplaceTaxonomyMetaSeed.source as keyof typeof TaxonomySource
          ],
        taxonomyVersion: marketplaceTaxonomyMetaSeed.taxonomyVersion,
        checksum: marketplaceTaxonomyMetaSeed.checksum,
        syncedAt: marketplaceTaxonomyMetaSeed.syncedAt
          ? new Date(marketplaceTaxonomyMetaSeed.syncedAt)
          : null
      }
    });

    const byExternalId = new Map<string, string>();

    for (const category of marketplaceCategoriesSeed) {
      const source = TaxonomySource[category.source as keyof typeof TaxonomySource];
      const parentId = category.parentExternalId
        ? byExternalId.get(category.parentExternalId) ?? null
        : null;

      const saved = await this.prisma.marketplaceCategory.upsert({
        where: {
          source_externalId: {
            source,
            externalId: category.externalId
          }
        },
        update: {
          parentId,
          title: category.title,
          fullPath: category.fullPath,
          level: category.level,
          isLeaf: category.isLeaf,
          isActive: category.isActive
        },
        create: {
          source,
          externalId: category.externalId,
          parentId,
          title: category.title,
          fullPath: category.fullPath,
          level: category.level,
          isLeaf: category.isLeaf,
          isActive: category.isActive
        }
      });

      byExternalId.set(category.externalId, saved.id);
    }
  }

  private async ensureSiteCategoriesSeed(shopId: string) {
    const siteCategoryIdsBySlug = new Map<string, string>();

    for (const category of siteCategoriesSeed) {
      const mappedMarketplaceCategory = category.mappedMarketplaceCategoryExternalId
        ? await this.prisma.marketplaceCategory.findUnique({
            where: {
              source_externalId: {
                source: TaxonomySource.MARKETPLACE,
                externalId: category.mappedMarketplaceCategoryExternalId
              }
            }
          })
        : null;

      const parentId = category.parentSlug
        ? siteCategoryIdsBySlug.get(category.parentSlug) ?? null
        : null;

      const existing = await this.prisma.siteCategory.findFirst({
        where: {
          shopId,
          slug: category.slug
        }
      });

      const saved = existing
        ? await this.prisma.siteCategory.update({
            where: { id: existing.id },
            data: {
              parentId,
              mappedMarketplaceCategoryId: mappedMarketplaceCategory?.id ?? null,
              title: category.title,
              description: category.description,
              seoTitle: category.seoTitle,
              seoDescription: category.seoDescription,
              sortOrder: category.sortOrder,
              isVisible: category.isVisible
            }
          })
        : await this.prisma.siteCategory.create({
            data: {
              shopId,
              parentId,
              mappedMarketplaceCategoryId: mappedMarketplaceCategory?.id ?? null,
              title: category.title,
              slug: category.slug,
              description: category.description,
              seoTitle: category.seoTitle,
              seoDescription: category.seoDescription,
              sortOrder: category.sortOrder,
              isVisible: category.isVisible
            }
          });

      siteCategoryIdsBySlug.set(category.slug, saved.id);
    }
  }

  private buildProductSlug(title: string, sku: string) {
    const normalized = title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/(^-|-$)/g, "");

    return normalized ? `${normalized}-${sku.toLowerCase()}` : sku.toLowerCase();
  }

  private getPurchasePrice(sku: string) {
    return sku === "KR30" ? 3220 : sku === "KR13" ? 2450 : 110;
  }

  private async ensureSeedProducts(shopId: string) {
    for (const product of seedProducts) {
      const siteCategory = await this.prisma.siteCategory.findFirst({
        where: {
          shopId,
          slug: product.siteCategorySlug
        },
        include: {
          mappedMarketplaceCategory: true
        }
      });

      const existing = await this.prisma.product.findFirst({
        where: {
          shopId,
          sku: product.sku
        }
      });

      const payload: Prisma.ProductUncheckedCreateInput = {
        shopId,
        siteCategoryId: siteCategory?.id ?? null,
        marketplaceCategoryId: siteCategory?.mappedMarketplaceCategory?.id ?? null,
        sku: product.sku,
        slug: this.buildProductSlug(product.title, product.sku),
        title: product.title,
        shortDescription: null,
        description: null,
        category: product.category,
        brand: "KaiRox",
        price: new Prisma.Decimal(product.price),
        compareAtPrice: null,
        purchasePrice: new Prisma.Decimal(this.getPurchasePrice(product.sku)),
        currency: "RUB",
        stock: product.stock,
        reservedStock: Math.max(0, product.stock - 4),
        seoTitle: product.title,
        seoDescription: `${product.title} — карточка товара KaiRox.`,
        attributesJson: {
          reviews: product.reviews
        }
      };

      if (existing) {
        await this.prisma.product.update({
          where: { id: existing.id },
          data: payload
        });
      } else {
        await this.prisma.product.create({
          data: payload
        });
      }
    }
  }

  private async ensureSeedData() {
    const shop = await this.ensureDefaultShop();
    await this.ensureMarketplaceTaxonomySeed();
    await this.ensureSiteCategoriesSeed(shop.id);
    await this.ensureSeedProducts(shop.id);
    return shop;
  }

  async getCatalog() {
    const shop = await this.ensureSeedData();

    const products = await this.prisma.product.findMany({
      where: { shopId: shop.id },
      include: {
        siteCategory: true,
        marketplaceCategory: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return products.map((product) => ({
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      title: product.title,
      category: product.siteCategory?.title ?? product.category,
      siteCategoryId: product.siteCategoryId,
      marketplaceCategoryId: product.marketplaceCategoryId,
      marketplaceCategoryTitle: product.marketplaceCategory?.title ?? null,
      price: Number(product.price),
      purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
      stock: product.stock,
      reserve: Math.max(0, product.stock - 4),
      reviews: Number(
        ((product.attributesJson as { reviews?: number } | null)?.reviews ?? 0)
      )
    }));
  }

  async getPricesAndStock() {
    const catalog = await this.getCatalog();

    return catalog.map((product) => ({
      ...product,
      purchasePrice: product.purchasePrice ?? this.getPurchasePrice(product.sku),
      reserve: Math.max(0, product.stock - 4)
    }));
  }

  async getReviews() {
    await this.ensureSeedData();
    return reviews;
  }
}
