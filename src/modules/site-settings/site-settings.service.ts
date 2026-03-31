import { Injectable } from "@nestjs/common";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { siteSettings } from "@/shared/mock-data/store.seed";

@Injectable()
export class SiteSettingsService {
  private state = structuredClone(siteSettings);

  getSettings() {
    return this.state;
  }

  updateSettings(payload: UpdateSiteSettingsDto) {
    this.state = {
      ...this.state,
      brandName: payload.brandName ?? this.state.brandName,
      colors: {
        ...this.state.colors,
        bg: payload.bg ?? this.state.colors.bg,
        panel: payload.panel ?? this.state.colors.panel,
        primary: payload.primary ?? this.state.colors.primary,
        primaryStrong: payload.primaryStrong ?? this.state.colors.primaryStrong,
        text: payload.text ?? this.state.colors.text,
        textSoft: payload.textSoft ?? this.state.colors.textSoft
      }
    };

    return this.state;
  }
}
