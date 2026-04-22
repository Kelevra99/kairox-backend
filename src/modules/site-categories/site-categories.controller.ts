import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
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

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() payload: CreateSiteCategoryDto
  ) {
    return this.siteCategoriesService.update(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.siteCategoriesService.remove(id);
  }
}
