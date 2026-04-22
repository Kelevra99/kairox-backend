import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { CreateSiteCategoryDto } from "./dto/create-site-category.dto";

@Injectable()
export class SiteCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/(^-|-$)/g, "");
  }

  private readonly defaultShopSlug = "default-store";

  private async ensureDefaultShop() {
    const shop = await this.prisma.shop.findUnique({
      where: { slug: this.defaultShopSlug }
    });

    if (!shop) {
      throw new BadRequestException("Default shop is not initialized.");
    }

    return shop;
  }

  async getMarketplaceCategories() {
    const categories = await this.prisma.marketplaceCategory.findMany({
      where: {
        isActive: true,
        isLeaf: true
      },
      orderBy: [{ level: "asc" }, { fullPath: "asc" }, { title: "asc" }]
    });

    return categories.map((category) => ({
      id: category.id,
      externalId: category.externalId,
      title: category.title,
      fullPath: category.fullPath,
      level: category.level
    }));
  }

  async getAll() {
    const shop = await this.ensureDefaultShop();

    const categories = await this.prisma.siteCategory.findMany({
      where: { shopId: shop.id },
      include: {
        parent: true,
        mappedMarketplaceCategory: true
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
    });

    return categories.map((category) => ({
      id: category.id,
      title: category.title,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      imageAlt: category.imageAlt,
      imageTitle: category.imageTitle,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      parentId: category.parentId,
      parentTitle: category.parent?.title ?? null,
      mappedMarketplaceCategoryId: category.mappedMarketplaceCategoryId,
      mappedMarketplaceCategoryTitle:
        category.mappedMarketplaceCategory?.title ?? null,
      sortOrder: category.sortOrder,
      isVisible: category.isVisible
    }));
  }

  async create(payload: CreateSiteCategoryDto) {
    const shop = await this.ensureDefaultShop();

    const normalizedSlug = this.normalizeSlug(payload.slug || payload.title);

    if (!normalizedSlug) {
      throw new BadRequestException("Category slug is required.");
    }

    const existing = await this.prisma.siteCategory.findFirst({
      where: {
        shopId: shop.id,
        slug: normalizedSlug
      }
    });

    if (existing) {
      throw new BadRequestException("Category with this slug already exists.");
    }

    if (payload.parentId) {
      const parent = await this.prisma.siteCategory.findFirst({
        where: {
          id: payload.parentId,
          shopId: shop.id
        }
      });

      if (!parent) {
        throw new BadRequestException("Parent category not found.");
      }
    }

    if (payload.mappedMarketplaceCategoryId) {
      const mapped = await this.prisma.marketplaceCategory.findUnique({
        where: { id: payload.mappedMarketplaceCategoryId }
      });

      if (!mapped) {
        throw new BadRequestException("Marketplace category not found.");
      }
    }

    const created = await this.prisma.siteCategory.create({
      data: {
        shopId: shop.id,
        parentId: payload.parentId ?? null,
        mappedMarketplaceCategoryId: payload.mappedMarketplaceCategoryId ?? null,
        title: payload.title,
        slug: normalizedSlug,
        description: payload.description ?? null,
        imageUrl: payload.imageUrl ?? null,
        imageAlt: payload.imageAlt ?? null,
        imageTitle: payload.imageTitle ?? null,
        seoTitle: payload.seoTitle ?? null,
        seoDescription: payload.seoDescription ?? null,
        sortOrder: payload.sortOrder ?? 0,
        isVisible: payload.isVisible ?? true
      },
      include: {
        parent: true,
        mappedMarketplaceCategory: true
      }
    });

    return {
      id: created.id,
      title: created.title,
      slug: created.slug,
      description: created.description,
      imageUrl: created.imageUrl,
      imageAlt: created.imageAlt,
      imageTitle: created.imageTitle,
      seoTitle: created.seoTitle,
      seoDescription: created.seoDescription,
      parentId: created.parentId,
      parentTitle: created.parent?.title ?? null,
      mappedMarketplaceCategoryId: created.mappedMarketplaceCategoryId,
      mappedMarketplaceCategoryTitle:
        created.mappedMarketplaceCategory?.title ?? null,
      sortOrder: created.sortOrder,
      isVisible: created.isVisible
    };
  }
}