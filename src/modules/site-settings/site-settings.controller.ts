import { Body, Controller, Delete, Get, Patch, Post, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { SiteSettingsService } from "./site-settings.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { UpdateAdminThemeDto } from "./dto/update-admin-theme.dto";

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

  @Get("admin-settings")
  getAdminSettings() {
    return this.siteSettingsService.getAdminSettings();
  }

  @Patch("admin-settings")
  updateAdminSettings(@Body() payload: UpdateAdminThemeDto) {
    return this.siteSettingsService.updateAdminSettings(payload);
  }

  @Post("assets")
  uploadAsset(@Req() request: FastifyRequest, @Query("type") type: string) {
    return this.siteSettingsService.uploadAsset(request, type);
  }

  @Delete("assets")
  deleteAsset(
    @Query("type") type: string,
    @Query("url") assetUrl: string
  ) {
    return this.siteSettingsService.deleteAsset(type, assetUrl);
  }
}
