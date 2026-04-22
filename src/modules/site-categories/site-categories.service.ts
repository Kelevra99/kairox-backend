import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { CreateSiteCategoryDto } from "./dto/create-site-category.dto";

@Injectable()
export class SiteCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultShopSlug = "default-store";

  private normalizeSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/(^-|-$)/g, "");
  }

  private async ensureDefaultShop() {
    const shop = await this.prisma.shop.findUnique({
      where: { slug: this.defaultShopSlug }
    });

    if (!shop) {
      throw new BadRequestException("Default shop is not initialized.");
    }

    return shop;
  }

  private mapCategory(category: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    imageTitle: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    parentId: string | null;
    sortOrder: number;
    isVisible: boolean;
    mappedMarketplaceCategoryId: string | null;
    parent?: { title: string } | null;
    mappedMarketplaceCategory?: { title: string } | null;
  }) {
    return {
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
    };
  }

  private async ensureParentBelongsToShop(
    shopId: string,
    parentId: string,
    currentCategoryId?: string
  ) {
    const parent = await this.prisma.siteCategory.findFirst({
      where: {
        id: parentId,
        shopId
      },
      select: {
        id: true,
        parentId: true
      }
    });

    if (!parent) {
      throw new BadRequestException("Parent category not found.");
    }

    if (currentCategoryId && parent.id === currentCategoryId) {
      throw new BadRequestException("Category cannot be its own parent.");
    }

    if (currentCategoryId) {
      let cursorParentId = parent.parentId;

      while (cursorParentId) {
        if (cursorParentId === currentCategoryId) {
          throw new BadRequestException(
            "Cannot move category into its own child branch."
          );
        }

        const nextParent = await this.prisma.siteCategory.findFirst({
          where: {
            id: cursorParentId,
            shopId
          },
          select: {
            parentId: true
          }
        });

        cursorParentId = nextParent?.parentId ?? null;
      }
    }
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

    return categories.map((category) => this.mapCategory(category));
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
      await this.ensureParentBelongsToShop(shop.id, payload.parentId);
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

    return this.mapCategory(created);
  }

  async update(id: string, payload: CreateSiteCategoryDto) {
    const shop = await this.ensureDefaultShop();

    const existingCategory = await this.prisma.siteCategory.findFirst({
      where: {
        id,
        shopId: shop.id
      }
    });

    if (!existingCategory) {
      throw new BadRequestException("Category not found.");
    }

    const normalizedSlug = this.normalizeSlug(payload.slug || payload.title);

    if (!normalizedSlug) {
      throw new BadRequestException("Category slug is required.");
    }

    const duplicate = await this.prisma.siteCategory.findFirst({
      where: {
        shopId: shop.id,
        slug: normalizedSlug,
        NOT: {
          id
        }
      }
    });

    if (duplicate) {
      throw new BadRequestException("Category with this slug already exists.");
    }

    if (payload.parentId) {
      await this.ensureParentBelongsToShop(shop.id, payload.parentId, id);
    }

    if (payload.mappedMarketplaceCategoryId) {
      const mapped = await this.prisma.marketplaceCategory.findUnique({
        where: { id: payload.mappedMarketplaceCategoryId }
      });

      if (!mapped) {
        throw new BadRequestException("Marketplace category not found.");
      }
    }

    const updated = await this.prisma.siteCategory.update({
      where: { id },
      data: {
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

    return this.mapCategory(updated);
  }
}
