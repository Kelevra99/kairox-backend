import { BadRequestException, Injectable } from "@nestjs/common";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { AppConfigService } from "@/modules/config/app-config.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { siteSettings } from "@/shared/mock-data/store.seed";

type SiteSettingsState = typeof siteSettings;
type AssetType = "logo" | "favicon";

const SITE_SETTINGS_KEY = "global";

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
  ) {}

  private normalizeValue(value: unknown): SiteSettingsState {
    const base = structuredClone(siteSettings);

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return base;
    }

    const candidate = value as Partial<SiteSettingsState> & {
      colors?: Partial<SiteSettingsState["colors"]>;
      modules?: Partial<SiteSettingsState["modules"]>;
      assets?: Partial<SiteSettingsState["assets"]>;
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
      },
      assets: {
        ...base.assets,
        ...candidate.assets
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
      },
      assets: {
        ...current.assets
      }
    };

    return this.saveSettings(nextState);
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
      modules: {
        ...current.modules
      },
      assets: {
        ...current.assets,
        ...(type === "logo" ? { logoUrl: assetUrl } : { faviconUrl: assetUrl })
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
