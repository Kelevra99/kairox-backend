import { Controller, Get } from "@nestjs/common";
import { DeliveryService } from "./delivery.service";

@Controller("delivery")
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get("settings")
  getSettings() {
    return this.deliveryService.getSettings();
  }

  @Get("reports")
  getReports() {
    return this.deliveryService.getReports();
  }
}
