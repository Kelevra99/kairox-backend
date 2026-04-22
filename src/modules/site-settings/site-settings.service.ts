import { BadRequestException, Injectable } from "@nestjs/common";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { FastifyRequest } from "fastify";
import { Prisma, ShopStatus, ShopDomainType, DomainVerificationStatus } from "@prisma/client";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { AppConfigService } from "@/modules/config/app-config.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { UpdateAdminThemeDto } from "./dto/update-admin-theme.dto";
import { siteSettings } from "@/shared/mock-data/store.seed";

type SiteSettingsState = typeof siteSettings;


function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
  ) {}

  private readonly defaultShopSlug = "default-store";
  private readonly defaultPreviewSubdomain = "default-store-preview";
  private readonly siteSettingsKey = "global";

  private async ensureDefaultShop() {
    const shop = await this.prisma.shop.upsert({
      where: { slug: this.defaultShopSlug },
      update: {},
      create: {
        name: "KaiRox Default Store",
        slug: this.defaultShopSlug,
        previewSubdomain: this.defaultPreviewSubdomain,
        status: ShopStatus.DRAFT,
        isPreviewProtected: true,
        previewAccessToken: null,
        domains: {
          create: {
            host: `${this.defaultPreviewSubdomain}.localhost`,
            type: ShopDomainType.PREVIEW,
            isPrimary: true,
            verificationStatus: DomainVerificationStatus.VERIFIED
          }
        }
      }
    });

    return shop;
  }

  private normalizeHex(value: unknown, fallback: string) {
    if (typeof value !== "string") return fallback;
    const normalized = value.trim();
    return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(normalized) ? normalized : fallback;
  }

  private normalizeString(value: unknown, fallback: string) {
    if (typeof value !== "string") return fallback;
    const normalized = value.trim();
    return normalized ? normalized : fallback;
  }

  private normalizeNullableString(value: unknown, fallback: string | null) {
    if (value === null) return null;
    if (typeof value !== "string") return fallback;
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

    if (!Number.isFinite(parsed)) return fallback;

    const rounded = Math.round(parsed);
    if (rounded < 0) return 0;
    if (rounded > 360) return 360;
    return rounded;
  }

  private normalizeSize(value: unknown, fallback: number, min = 0, max = 200) {
    const parsed =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseFloat(value)
          : Number.NaN;

    if (!Number.isFinite(parsed)) return fallback;

    const rounded = Math.round(parsed);
    if (rounded < min) return min;
    if (rounded > max) return max;
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
      typography?: Partial<SiteSettingsState["typography"]>;
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
      typography: {
        ...base.typography,
        ...candidate.typography
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
    const shop = await this.ensureDefaultShop();

    const existing = await this.prisma.siteTheme.findUnique({
      where: {
        shopId_key: {
          shopId: shop.id,
          key: this.siteSettingsKey
        }
      }
    });

    if (existing) {
      return this.normalizeValue(existing.value);
    }

    const created = await this.prisma.siteTheme.create({
      data: {
        shopId: shop.id,
        key: this.siteSettingsKey,
        value: structuredClone(siteSettings) as Prisma.InputJsonValue
      }
    });

    return this.normalizeValue(created.value);
  }

  private async saveSettings(nextState: SiteSettingsState) {
    const shop = await this.ensureDefaultShop();

    const saved = await this.prisma.siteTheme.upsert({
      where: {
        shopId_key: {
          shopId: shop.id,
          key: this.siteSettingsKey
        }
      },
      update: {
        value: nextState as Prisma.InputJsonValue
      },
      create: {
        shopId: shop.id,
        key: this.siteSettingsKey,
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
    const typography = isRecord(payload.typography) ? payload.typography : {};

    const nextState: SiteSettingsState = {
      ...current,
      brandName: this.normalizeString(payload.brandName, current.brandName),
      colors: {
        ...current.colors,
        bg: this.normalizeHex(colors.bg ?? appearance.pageBg ?? raw.bg, current.colors.bg),
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
        surfaceBgTo: this.normalizeHex(appearance.surfaceBgTo, current.appearance.surfaceBgTo),
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
      typography: {
        ...current.typography,
        pageHeadingColor: this.normalizeHex(
          typography.pageHeadingColor,
          current.typography.pageHeadingColor
        ),
        pageTextColor: this.normalizeHex(
          typography.pageTextColor,
          current.typography.pageTextColor
        ),
        blockHeadingColor: this.normalizeHex(
          typography.blockHeadingColor,
          current.typography.blockHeadingColor
        ),
        blockTextColor: this.normalizeHex(
          typography.blockTextColor,
          current.typography.blockTextColor
        ),
        bodyFontFamily: this.normalizeString(
          typography.bodyFontFamily,
          current.typography.bodyFontFamily
        ),
        headingFontFamily: this.normalizeString(
          typography.headingFontFamily,
          current.typography.headingFontFamily
        ),
        bodyFontSize: this.normalizeSize(
          typography.bodyFontSize,
          current.typography.bodyFontSize,
          10,
          32
        ),
        bodyLineHeight: this.normalizeSize(
          typography.bodyLineHeight,
          current.typography.bodyLineHeight,
          1,
          3
        ),
        bodyFontWeight: this.normalizeSize(
          typography.bodyFontWeight,
          current.typography.bodyFontWeight,
          100,
          900
        ),
        bodyItalic: this.normalizeBoolean(
          typography.bodyItalic,
          current.typography.bodyItalic
        ),
        headingFontSize: this.normalizeSize(
          typography.headingFontSize,
          current.typography.headingFontSize,
          14,
          72
        ),
        headingLineHeight: this.normalizeSize(
          typography.headingLineHeight,
          current.typography.headingLineHeight,
          1,
          3
        ),
        headingFontWeight: this.normalizeSize(
          typography.headingFontWeight,
          current.typography.headingFontWeight,
          100,
          900
        ),
        headingLetterSpacing: this.normalizeSize(
          typography.headingLetterSpacing,
          current.typography.headingLetterSpacing,
          -2,
          20
        ),
        headingUppercase: this.normalizeBoolean(
          typography.headingUppercase,
          current.typography.headingUppercase
        ),
        bodyFontUrl: this.normalizeNullableString(
          typography.bodyFontUrl,
          current.typography.bodyFontUrl
        ),
        headingFontUrl: this.normalizeNullableString(
          typography.headingFontUrl,
          current.typography.headingFontUrl
        )
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
    const source = isRecord(payload.settings)
      ? payload.settings
      : (payload as unknown as Record<string, unknown>);

    const nextState: SiteSettingsState = {
      ...current,
      colors: {
        ...current.colors
      },
      appearance: {
        ...current.appearance
      },
      typography: {
        ...current.typography
      },
      modules: {
        ...current.modules
      },
      assets: {
        ...current.assets
      },
      adminTheme: {
        ...current.adminTheme,
        shellBg: this.normalizeHex(source.shellBg, current.adminTheme.shellBg),
        sidebarBg: this.normalizeHex(source.sidebarBg, current.adminTheme.sidebarBg),
        panel: this.normalizeHex(source.panel, current.adminTheme.panel),
        panelStrong: this.normalizeHex(source.panelStrong, current.adminTheme.panelStrong),
        primary: this.normalizeHex(source.primary, current.adminTheme.primary),
        primaryStrong: this.normalizeHex(source.primaryStrong, current.adminTheme.primaryStrong),

        buttonUseGradient: this.normalizeBoolean(
          source.buttonUseGradient,
          current.adminTheme.buttonUseGradient
        ),
        buttonBg: this.normalizeHex(source.buttonBg, current.adminTheme.buttonBg),
        buttonBgTo: this.normalizeHex(source.buttonBgTo, current.adminTheme.buttonBgTo),
        buttonGradientAngle: this.normalizeAngle(
          source.buttonGradientAngle,
          current.adminTheme.buttonGradientAngle
        ),
        buttonText: this.normalizeHex(source.buttonText, current.adminTheme.buttonText),

        text: this.normalizeHex(source.text, current.adminTheme.text),
        contentText: this.normalizeHex(source.contentText, current.adminTheme.contentText),
        textSoft: this.normalizeHex(source.textSoft, current.adminTheme.textSoft),
        inputText: this.normalizeHex(source.inputText, current.adminTheme.inputText),
        headingText: this.normalizeHex(source.headingText, current.adminTheme.headingText),

        inputBg: this.normalizeHex(source.inputBg, current.adminTheme.inputBg),
        layoutGap: this.normalizeSize(source.layoutGap, current.adminTheme.layoutGap, 4, 40),
        panelPadding: this.normalizeSize(source.panelPadding, current.adminTheme.panelPadding, 4, 40),
        controlPaddingX: this.normalizeSize(
          source.controlPaddingX,
          current.adminTheme.controlPaddingX,
          4,
          40
        ),
        controlPaddingY: this.normalizeSize(
          source.controlPaddingY,
          current.adminTheme.controlPaddingY,
          2,
          24
        ),
        controlHeight: this.normalizeSize(
          source.controlHeight,
          current.adminTheme.controlHeight,
          28,
          90
        ),

        bodyFontFamily: this.normalizeString(
          source.bodyFontFamily,
          current.adminTheme.bodyFontFamily
        ),
        headingFontFamily: this.normalizeString(
          source.headingFontFamily,
          current.adminTheme.headingFontFamily
        ),
        bodyFontSize: this.normalizeSize(
          source.bodyFontSize,
          current.adminTheme.bodyFontSize,
          10,
          32
        ),
        bodyLineHeight: this.normalizeSize(
          source.bodyLineHeight,
          current.adminTheme.bodyLineHeight,
          1,
          3
        ),
        bodyFontWeight: this.normalizeSize(
          source.bodyFontWeight,
          current.adminTheme.bodyFontWeight,
          100,
          900
        ),
        bodyItalic: this.normalizeBoolean(
          source.bodyItalic,
          current.adminTheme.bodyItalic
        ),
        headingFontSize: this.normalizeSize(
          source.headingFontSize,
          current.adminTheme.headingFontSize,
          14,
          72
        ),
        headingLineHeight: this.normalizeSize(
          source.headingLineHeight,
          current.adminTheme.headingLineHeight,
          1,
          3
        ),
        headingFontWeight: this.normalizeSize(
          source.headingFontWeight,
          current.adminTheme.headingFontWeight,
          100,
          900
        ),
        headingLetterSpacing: this.normalizeSize(
          source.headingLetterSpacing,
          current.adminTheme.headingLetterSpacing,
          -2,
          20
        ),
        headingUppercase: this.normalizeBoolean(
          source.headingUppercase,
          current.adminTheme.headingUppercase
        ),
        bodyFontUrl: this.normalizeNullableString(
          source.bodyFontUrl,
          current.adminTheme.bodyFontUrl
        ),
        headingFontUrl: this.normalizeNullableString(
          source.headingFontUrl,
          current.adminTheme.headingFontUrl
        )
      }
    };

    const saved = await this.saveSettings(nextState);
    return saved.adminTheme;
  }

  async uploadAsset(request: FastifyRequest, type: string) {
    const file = await request.file();

    if (!file) {
      throw new BadRequestException("File is required.");
    }

    const imageTypes = new Set(["logo", "favicon"]);
    const fontTypes = new Set([
      "site-body-font",
      "site-heading-font",
      "admin-body-font",
      "admin-heading-font"
    ]);

    if (!imageTypes.has(type) && !fontTypes.has(type)) {
      throw new BadRequestException("Unknown upload type.");
    }

    const extension = this.resolveExtension(file.filename, file.mimetype);

    if (!extension) {
      throw new BadRequestException("Unsupported file format.");
    }

    if (imageTypes.has(type) && !file.mimetype.startsWith("image/")) {
      throw new BadRequestException("Only image uploads are allowed for this field.");
    }

    if (fontTypes.has(type) && !this.isFontExtension(extension)) {
      throw new BadRequestException("Only .woff2, .woff, .ttf, .otf are allowed for fonts.");
    }

    const buffer = await file.toBuffer();

    const directory = fontTypes.has(type)
      ? join(process.cwd(), "uploads", "fonts")
      : join(process.cwd(), "uploads", "site");

    await mkdir(directory, { recursive: true });

    const filename = `${type}-${Date.now()}${extension}`;
    await writeFile(join(directory, filename), buffer);

    const assetUrl = fontTypes.has(type)
      ? `${this.config.assetBaseUrl}/uploads/fonts/${filename}`
      : `${this.config.assetBaseUrl}/uploads/site/${filename}`;

    const current = await this.ensureSettings();

    const nextState: SiteSettingsState = {
      ...current,
      colors: {
        ...current.colors
      },
      appearance: {
        ...current.appearance
      },
      typography: {
        ...current.typography
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

    if (type === "logo") {
      nextState.assets.logoUrl = assetUrl;
    } else if (type === "favicon") {
      nextState.assets.faviconUrl = assetUrl;
    } else if (type === "site-body-font") {
      nextState.typography.bodyFontUrl = assetUrl;
    } else if (type === "site-heading-font") {
      nextState.typography.headingFontUrl = assetUrl;
    } else if (type === "admin-body-font") {
      nextState.adminTheme.bodyFontUrl = assetUrl;
    } else if (type === "admin-heading-font") {
      nextState.adminTheme.headingFontUrl = assetUrl;
    }

    return this.saveSettings(nextState);
  }

  private isFontExtension(extension: string) {
    return [".woff2", ".woff", ".ttf", ".otf"].includes(extension);
  }

  private resolveExtension(filename: string | undefined, mimeType: string) {
    const fromName = extname(filename ?? "").toLowerCase();

    if (
      [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".svg",
        ".ico",
        ".woff2",
        ".woff",
        ".ttf",
        ".otf"
      ].includes(fromName)
    ) {
      return fromName === ".jpeg" ? ".jpg" : fromName;
    }

    const byMime: Record<string, string> = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/x-icon": ".ico",
      "image/vnd.microsoft.icon": ".ico",
      "font/woff2": ".woff2",
      "font/woff": ".woff",
      "font/ttf": ".ttf",
      "font/otf": ".otf",
      "application/font-woff": ".woff",
      "application/x-font-ttf": ".ttf",
      "application/x-font-opentype": ".otf",
      "application/octet-stream": fromName || ""
    };

    return byMime[mimeType] || null;
  }
}
