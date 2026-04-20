import { Module } from "@nestjs/common";
import { AppConfigModule } from "@/modules/config/app-config.module";
import { SiteSettingsController } from "./site-settings.controller";
import { SiteSettingsService } from "./site-settings.service";

@Module({
  imports: [AppConfigModule],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService]
})
export class SiteSettingsModule {}
