import { Body, Controller, Get, Post } from "@nestjs/common";
import { SiteCategoriesService } from "./site-categories.service";
import { CreateSiteCategoryDto } from "./dto/create-site-category.dto";

@Controller("site-categories")
export class SiteCategoriesController {
  constructor(
    private readonly siteCategoriesService: SiteCategoriesService
  ) {}

  @Get("marketplace-categories")
  getMarketplaceCategories() {
    return this.siteCategoriesService.getMarketplaceCategories();
  }

  @Get()
  getAll() {
    return this.siteCategoriesService.getAll();
  }

  @Post()
  create(@Body() payload: CreateSiteCategoryDto) {
    return this.siteCategoriesService.create(payload);
  }
}