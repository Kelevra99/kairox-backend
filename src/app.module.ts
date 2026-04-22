import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { AppConfigModule } from "./modules/config/app-config.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { DialogsModule } from "./modules/dialogs/dialogs.module";
import { HealthModule } from "./modules/health/health.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { ProductsModule } from "./modules/products/products.module";
import { PromotionModule } from "./modules/promotion/promotion.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { SiteSettingsModule } from "./modules/site-settings/site-settings.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { SiteCategoriesModule } from "./modules/site-categories/site-categories.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    AppConfigModule,
    PrismaModule,
    HealthModule,
    DashboardModule,
    SiteCategoriesModule,
    OrdersModule,
    ProductsModule,
    DeliveryModule,
    PromotionModule,
    CustomersModule,
    DialogsModule,
    SiteSettingsModule
  ]
})
export class AppModule {}
