import { Injectable } from "@nestjs/common";
import { products, reviews } from "@/shared/mock-data/store.seed";

@Injectable()
export class ProductsService {
  getCatalog() {
    return products;
  }

  getPricesAndStock() {
    return products.map((product) => ({
      ...product,
      purchasePrice: product.sku === "KR30" ? 3220 : product.sku === "KR13" ? 2450 : 110,
      reserve: Math.max(0, product.stock - 4)
    }));
  }

  getReviews() {
    return reviews;
  }
}
