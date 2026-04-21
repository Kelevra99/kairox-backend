

import { createHash } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";

type FontVariantStyle = "normal" | "italic";

type FontFamilyConfig = {
  id: string;
  family: string;
  weights: number[];
  italic: boolean;
};

type ManifestFile = {
  family: string;
  sourceUrl: string;
  publicPath: string;
  localPath: string;
};

type ManifestEntry = {
  id: string;
  family: string;
  weights: number[];
  italic: boolean;
};

type FontManifest = {
  generatedAt: string;
  cssFile: string;
  families: ManifestEntry[];
  files: ManifestFile[];
};

const FONT_FAMILIES: FontFamilyConfig[] = [
  { id: "inter", family: "Inter", weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { id: "roboto", family: "Roboto", weights: [300, 400, 500, 700, 900], italic: true },
  { id: "open-sans", family: "Open Sans", weights: [300, 400, 500, 600, 700, 800], italic: true },
  { id: "source-sans-3", family: "Source Sans 3", weights: [200, 300, 400, 500, 600, 700, 800, 900], italic: true },
  { id: "rubik", family: "Rubik", weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { id: "pt-sans", family: "PT Sans", weights: [400, 700], italic: true },
  { id: "noto-sans", family: "Noto Sans", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], italic: true },
  { id: "manrope", family: "Manrope", weights: [200, 300, 400, 500, 600, 700, 800], italic: false },
  { id: "mulish", family: "Mulish", weights: [200, 300, 400, 500, 600, 700, 800, 900], italic: true },
  { id: "nunito", family: "Nunito", weights: [200, 300, 400, 500, 600, 700, 800, 900], italic: true },
  { id: "raleway", family: "Raleway", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], italic: true },
  { id: "roboto-condensed", family: "Roboto Condensed", weights: [300, 400, 500, 600, 700, 800], italic: true },
  { id: "montserrat", family: "Montserrat", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], italic: true },
  { id: "merriweather", family: "Merriweather", weights: [300, 400, 700, 900], italic: true },
  { id: "playfair-display", family: "Playfair Display", weights: [400, 500, 600, 700, 800, 900], italic: true },
  { id: "lora", family: "Lora", weights: [400, 500, 600, 700], italic: true },
  { id: "noto-serif", family: "Noto Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], italic: true }
];

const FRONTEND_ROOT = path.resolve(process.cwd(), "../frontend");
const OUTPUT_ROOT = path.join(FRONTEND_ROOT, "public", "fonts", "google");
const CSS_OUTPUT_PATH = path.join(OUTPUT_ROOT, "fonts.css");
const MANIFEST_PATH = path.join(OUTPUT_ROOT, "manifest.json");
const PUBLIC_PREFIX = "/fonts/google";

function buildGoogleCssUrl(config: FontFamilyConfig) {
  const url = new URL("https://fonts.googleapis.com/css2");

  if (config.italic) {
    const tuples = [
      ...config.weights.map((weight) => `0,${weight}`),
      ...config.weights.map((weight) => `1,${weight}`)
    ].join(";");

    url.searchParams.append("family", `${config.family}:ital,wght@${tuples}`);
  } else {
    url.searchParams.append("family", `${config.family}:wght@${config.weights.join(";")}`);
  }

  url.searchParams.append("display", "swap");
  url.searchParams.append("subset", "latin,cyrillic");

  return url.toString();
}

function hash(input: string) {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

function sanitizeFamilyName(family: string) {
  return family.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ensureDir(target: string) {
  await fs.mkdir(target, { recursive: true });
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

async function fetchBuffer(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function extractFontUrls(cssText: string) {
  const matches = [...cssText.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)];
  return matches.map((match) => match[1]);
}

async function downloadCssAssets(cssText: string, familySlug: string, files: ManifestFile[]) {
  let nextCss = cssText;
  const urls = [...new Set(extractFontUrls(cssText))];

  for (const url of urls) {
    const urlHash = hash(url);
    const extension = path.extname(new URL(url).pathname) || ".woff2";
    const fileName = `${familySlug}-${urlHash}${extension}`;
    const outputDir = path.join(OUTPUT_ROOT, familySlug);
    const outputPath = path.join(outputDir, fileName);
    const publicPath = `${PUBLIC_PREFIX}/${familySlug}/${fileName}`;

    await ensureDir(outputDir);

    try {
      await fs.access(outputPath);
    } catch {
      const buffer = await fetchBuffer(url);
      await fs.writeFile(outputPath, buffer);
    }

    files.push({
      family: familySlug,
      sourceUrl: url,
      publicPath,
      localPath: outputPath
    });

    nextCss = nextCss.split(url).join(publicPath);
  }

  return nextCss;
}

async function run() {
  await ensureDir(OUTPUT_ROOT);

  const cssChunks: string[] = [];
  const files: ManifestFile[] = [];

  for (const config of FONT_FAMILIES) {
    const familySlug = sanitizeFamilyName(config.family);
    const cssUrl = buildGoogleCssUrl(config);

    console.log(`→ ${config.family}`);
    const remoteCss = await fetchText(cssUrl);
    const localCss = await downloadCssAssets(remoteCss, familySlug, files);

    cssChunks.push(`/* ${config.family} */\n${localCss.trim()}\n`);
  }

  const uniqueFiles = Array.from(new Map(files.map((file) => [file.publicPath, file])).values());

  await fs.writeFile(CSS_OUTPUT_PATH, `${cssChunks.join("\n")}`.trim() + "\n", "utf8");

  const manifest: FontManifest = {
    generatedAt: new Date().toISOString(),
    cssFile: `${PUBLIC_PREFIX}/fonts.css`,
    families: FONT_FAMILIES.map((item) => ({
      id: item.id,
      family: item.family,
      weights: item.weights,
      italic: item.italic
    })),
    files: uniqueFiles
  };

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`✓ Fonts CSS: ${CSS_OUTPUT_PATH}`);
  console.log(`✓ Fonts manifest: ${MANIFEST_PATH}`);
  console.log(`✓ Downloaded files: ${uniqueFiles.length}`);
}

run().catch((error) => {
  console.error("Font bootstrap failed:", error);
  process.exitCode = 1;
});