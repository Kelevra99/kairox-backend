import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { siteSettings } from "@/shared/mock-data/store.seed";

type SiteSettingsState = typeof siteSettings;

const SITE_SETTINGS_KEY = "global";

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeValue(value: unknown): SiteSettingsState {
    const base = structuredClone(siteSettings);

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return base;
    }

    const candidate = value as Partial<SiteSettingsState> & {
      colors?: Partial<SiteSettingsState["colors"]>;
      modules?: Partial<SiteSettingsState["modules"]>;
    };

    return {
      ...base,
      ...candidate,
      colors: {
        ...base.colors,
        ...candidate.colors
      },
      modules: {
        ...base.modules,
        ...candidate.modules
      }
    };
  }

  private async ensureSettings(): Promise<SiteSettingsState> {
    const existing = await this.prisma.siteTheme.findUnique({
      where: { key: SITE_SETTINGS_KEY }
    });

    if (existing) {
      return this.normalizeValue(existing.value);
    }

    const created = await this.prisma.siteTheme.create({
      data: {
        key: SITE_SETTINGS_KEY,
        value: structuredClone(siteSettings) as Prisma.InputJsonValue
      }
    });

    return this.normalizeValue(created.value);
  }

  async getSettings() {
    return this.ensureSettings();
  }

  async updateSettings(payload: UpdateSiteSettingsDto) {
    const current = await this.ensureSettings();

    const nextState: SiteSettingsState = {
      ...current,
      brandName: payload.brandName ?? current.brandName,
      colors: {
        ...current.colors,
        bg: payload.bg ?? current.colors.bg,
        panel: payload.panel ?? current.colors.panel,
        primary: payload.primary ?? current.colors.primary,
        primaryStrong: payload.primaryStrong ?? current.colors.primaryStrong,
        text: payload.text ?? current.colors.text,
        textSoft: payload.textSoft ?? current.colors.textSoft
      },
      modules: {
        ...current.modules
      }
    };

    const saved = await this.prisma.siteTheme.upsert({
      where: { key: SITE_SETTINGS_KEY },
      update: {
        value: nextState as Prisma.InputJsonValue
      },
      create: {
        key: SITE_SETTINGS_KEY,
        value: nextState as Prisma.InputJsonValue
      }
    });

    return this.normalizeValue(saved.value);
  }
}
