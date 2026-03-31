import { Injectable } from "@nestjs/common";
import { dashboardSummary } from "@/shared/mock-data/store.seed";

@Injectable()
export class DashboardService {
  getSummary() {
    return dashboardSummary;
  }
}
