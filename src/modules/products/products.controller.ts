import { Controller, Get } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get("catalog")
  getCatalog() {
    return this.productsService.getCatalog();
  }

  @Get("prices")
  getPricesAndStock() {
    return this.productsService.getPricesAndStock();
  }

  @Get("reviews")
  getReviews() {
    return this.productsService.getReviews();
  }
}
