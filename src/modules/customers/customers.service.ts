import { Injectable } from "@nestjs/common";
import { customers } from "@/shared/mock-data/store.seed";

@Injectable()
export class CustomersService {
  findAll() {
    return customers;
  }
}
