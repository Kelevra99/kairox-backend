import { Injectable } from "@nestjs/common";
import { promotionOverview } from "@/shared/mock-data/store.seed";

@Injectable()
export class PromotionService {
  getOverview() {
    return promotionOverview;
  }
}
