import { Injectable } from "@nestjs/common";
import { deliverySettings } from "@/shared/mock-data/store.seed";

@Injectable()
export class DeliveryService {
  getSettings() {
    return deliverySettings;
  }

  getReports() {
    return {
      averageEtaDays: 3.8,
      averageCost: 286,
      buyoutRate: 96.4,
      returnRate: 2.8
    };
  }
}
