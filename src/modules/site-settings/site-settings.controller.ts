import { Body, Controller, Get, Patch } from "@nestjs/common";
import { SiteSettingsService } from "./site-settings.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";

@Controller("site")
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get("settings")
  getSettings() {
    return this.siteSettingsService.getSettings();
  }

  @Patch("settings")
  updateSettings(@Body() payload: UpdateSiteSettingsDto) {
    return this.siteSettingsService.updateSettings(payload);
  }
}
