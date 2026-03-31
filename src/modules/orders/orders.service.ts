import { Injectable } from "@nestjs/common";
import { orders } from "@/shared/mock-data/store.seed";

@Injectable()
export class OrdersService {
  findAll() {
    return orders;
  }
}
