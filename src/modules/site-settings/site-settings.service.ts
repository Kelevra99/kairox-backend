import { BadRequestException, Injectable } from "@nestjs/common";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { AppConfigService } from "@/modules/config/app-config.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { UpdateAdminThemeDto } from "./dto/update-admin-theme.dto";
import { siteSettings } from "@/shared/mock-data/store.seed";

type SiteSettingsState = typeof siteSettings;

const SITE_SETTINGS_KEY = "global";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
  ) {}

  private normalizeHex(value: unknown, fallback: string) {
    if (typeof value !== "string") {
      return fallback;
    }

    const normalized = value.trim();
    return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(normalized) ? normalized : fallback;
  }

  private normalizeString(value: unknown, fallback: string) {
    if (typeof value !== "string") {
      return fallback;
    }

    const normalized = value.trim();
    return normalized ? normalized : fallback;
  }

  private normalizeBoolean(value: unknown, fallback: boolean) {
    return typeof value === "boolean" ? value : fallback;
  }

  private normalizeAngle(value: unknown, fallback: number) {
    const parsed =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseFloat(value)
          : Number.NaN;

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    const rounded = Math.round(parsed);

    if (rounded < 0) return 0;
    if (rounded > 360) return 360;

    return rounded;
  }

  private normalizeValue(value: unknown): SiteSettingsState {
    const base = structuredClone(siteSettings);

    if (!isRecord(value)) {
      return base;
    }

    const candidate = value as Partial<SiteSettingsState> & {
      colors?: Partial<SiteSettingsState["colors"]>;
      appearance?: Partial<SiteSettingsState["appearance"]>;
      modules?: Partial<SiteSettingsState["modules"]>;
      assets?: Partial<SiteSettingsState["assets"]>;
      adminTheme?: Partial<SiteSettingsState["adminTheme"]>;
    };

    return {
      ...base,
      ...candidate,
      colors: {
        ...base.colors,
        ...candidate.colors
      },
      appearance: {
        ...base.appearance,
        ...candidate.appearance
      },
      modules: {
        ...base.modules,
        ...candidate.modules
      },
      assets: {
        ...base.assets,
        ...candidate.assets
      },
      adminTheme: {
        ...base.adminTheme,
        ...candidate.adminTheme
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

  private async saveSettings(nextState: SiteSettingsState) {
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

  async getSettings() {
    return this.ensureSettings();
  }

  async updateSettings(payload: UpdateSiteSettingsDto) {
    const current = await this.ensureSettings();

    const raw = payload as Record<string, unknown>;
    const colors = isRecord(payload.colors) ? payload.colors : {};
    const appearance = isRecord(payload.appearance) ? payload.appearance : {};

    const nextState: SiteSettingsState = {
      ...current,
      brandName: this.normalizeString(payload.brandName, current.brandName),
      colors: {
        ...current.colors,
        bg: this.normalizeHex(
          colors.bg ?? appearance.pageBg ?? raw.bg,
          current.colors.bg
        ),
        panel: this.normalizeHex(
          colors.panel ?? appearance.surfaceBg ?? raw.panel,
          current.colors.panel
        ),
        primary: this.normalizeHex(colors.primary ?? raw.primary, current.colors.primary),
        primaryStrong: this.normalizeHex(
          colors.primaryStrong ?? raw.primaryStrong,
          current.colors.primaryStrong
        ),
        text: this.normalizeHex(colors.text ?? raw.text, current.colors.text),
        textSoft: this.normalizeHex(colors.textSoft ?? raw.textSoft, current.colors.textSoft)
      },
      appearance: {
        ...current.appearance,
        pageUseGradient: this.normalizeBoolean(
          appearance.pageUseGradient,
          current.appearance.pageUseGradient
        ),
        pageBg: this.normalizeHex(appearance.pageBg, current.appearance.pageBg),
        pageBgTo: this.normalizeHex(appearance.pageBgTo, current.appearance.pageBgTo),
        pageGradientAngle: this.normalizeAngle(
          appearance.pageGradientAngle,
          current.appearance.pageGradientAngle
        ),
        pageGlowEnabled: this.normalizeBoolean(
          appearance.pageGlowEnabled,
          current.appearance.pageGlowEnabled
        ),
        pageGlowColor: this.normalizeHex(
          appearance.pageGlowColor,
          current.appearance.pageGlowColor
        ),

        headerUseGradient: this.normalizeBoolean(
          appearance.headerUseGradient,
          current.appearance.headerUseGradient
        ),
        headerBg: this.normalizeHex(appearance.headerBg, current.appearance.headerBg),
        headerBgTo: this.normalizeHex(appearance.headerBgTo, current.appearance.headerBgTo),
        headerGradientAngle: this.normalizeAngle(
          appearance.headerGradientAngle,
          current.appearance.headerGradientAngle
        ),

        surfaceUseGradient: this.normalizeBoolean(
          appearance.surfaceUseGradient,
          current.appearance.surfaceUseGradient
        ),
        surfaceBg: this.normalizeHex(appearance.surfaceBg, current.appearance.surfaceBg),
        surfaceBgTo: this.normalizeHex(
          appearance.surfaceBgTo,
          current.appearance.surfaceBgTo
        ),
        surfaceGradientAngle: this.normalizeAngle(
          appearance.surfaceGradientAngle,
          current.appearance.surfaceGradientAngle
        ),

        buttonUseGradient: this.normalizeBoolean(
          appearance.buttonUseGradient,
          current.appearance.buttonUseGradient
        ),
        buttonBg: this.normalizeHex(appearance.buttonBg, current.appearance.buttonBg),
        buttonBgTo: this.normalizeHex(appearance.buttonBgTo, current.appearance.buttonBgTo),
        buttonGradientAngle: this.normalizeAngle(
          appearance.buttonGradientAngle,
          current.appearance.buttonGradientAngle
        ),
        buttonText: this.normalizeHex(appearance.buttonText, current.appearance.buttonText)
      },
      modules: {
        ...current.modules
      },
      assets: {
        ...current.assets
      },
      adminTheme: {
        ...current.adminTheme
      }
    };

    return this.saveSettings(nextState);
  }

  async getAdminSettings() {
    const current = await this.ensureSettings();
    return current.adminTheme;
  }

  async updateAdminSettings(payload: UpdateAdminThemeDto) {
    const current = await this.ensureSettings();

    const nextState: SiteSettingsState = {
      ...current,
      colors: {
        ...current.colors
      },
      appearance: {
        ...current.appearance
      },
      modules: {
        ...current.modules
      },
      assets: {
        ...current.assets
      },
      adminTheme: {
        ...current.adminTheme,
        shellBg: payload.shellBg ?? current.adminTheme.shellBg,
        sidebarBg: payload.sidebarBg ?? current.adminTheme.sidebarBg,
        panel: payload.panel ?? current.adminTheme.panel,
        panelStrong: payload.panelStrong ?? current.adminTheme.panelStrong,
        primary: payload.primary ?? current.adminTheme.primary,
        primaryStrong: payload.primaryStrong ?? current.adminTheme.primaryStrong,
        text: payload.text ?? current.adminTheme.text,
        textSoft: payload.textSoft ?? current.adminTheme.textSoft
      }
    };

    const saved = await this.saveSettings(nextState);
    return saved.adminTheme;
  }

  async uploadAsset(request: FastifyRequest, type: string) {
    if (type !== "logo" && type !== "favicon") {
      throw new BadRequestException("Unknown asset type. Use logo or favicon.");
    }

    const file = await request.file();

    if (!file) {
      throw new BadRequestException("File is required.");
    }

    if (!file.mimetype.startsWith("image/")) {
      throw new BadRequestException("Only image uploads are allowed.");
    }

    const extension = this.resolveExtension(file.filename, file.mimetype);

    if (!extension) {
      throw new BadRequestException("Unsupported image format.");
    }

    const buffer = await file.toBuffer();

    const directory = join(process.cwd(), "uploads", "site");
    await mkdir(directory, { recursive: true });

    const filename = `${type}-${Date.now()}${extension}`;
    await writeFile(join(directory, filename), buffer);

    const assetUrl = `${this.config.assetBaseUrl}/uploads/site/${filename}`;

    const current = await this.ensureSettings();

    const nextState: SiteSettingsState = {
      ...current,
      colors: {
        ...current.colors
      },
      appearance: {
        ...current.appearance
      },
      modules: {
        ...current.modules
      },
      assets: {
        ...current.assets,
        ...(type === "logo" ? { logoUrl: assetUrl } : { faviconUrl: assetUrl })
      },
      adminTheme: {
        ...current.adminTheme
      }
    };

    return this.saveSettings(nextState);
  }

  private resolveExtension(filename: string | undefined, mimeType: string) {
    const fromName = extname(filename ?? "").toLowerCase();

    if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"].includes(fromName)) {
      return fromName === ".jpeg" ? ".jpg" : fromName;
    }

    const byMime: Record<string, string> = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/x-icon": ".ico",
      "image/vnd.microsoft.icon": ".ico"
    };

    return byMime[mimeType] ?? null;
  }
}
