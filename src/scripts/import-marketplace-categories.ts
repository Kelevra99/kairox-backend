import { PrismaClient, TaxonomySource } from "@prisma/client";
import * as XLSX from "xlsx";
import { resolve } from "path";

const prisma = new PrismaClient();

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function buildExternalId(parent: string, child?: string) {
  const source = child ? `${parent}__${child}` : parent;
  return source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error(
      "Укажи путь к Excel-файлу. Пример: npm run marketplace:categories:import -- ./imports/marketplace-categories.xlsx"
    );
  }

  const absolutePath = resolve(process.cwd(), inputPath);
  const workbook = XLSX.readFile(absolutePath);
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("В Excel-файле не найдено ни одного листа.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: ""
  });

  if (rows.length === 0) {
    throw new Error("Excel-файл пустой.");
  }

  const dataRows = rows.slice(1);
  const parentMap = new Map<string, string>();

  let parentCount = 0;
  let childCount = 0;
  let skipped = 0;

  await prisma.marketplaceTaxonomyMeta.upsert({
    where: { source: TaxonomySource.MARKETPLACE },
    update: {
      taxonomyVersion: 1,
      syncedAt: new Date()
    },
    create: {
      source: TaxonomySource.MARKETPLACE,
      taxonomyVersion: 1,
      syncedAt: new Date()
    }
  });

  for (const row of dataRows) {
    const parentTitle = normalizeText(row[0]);
    const childTitle = normalizeText(row[1]);

    if (!parentTitle) {
      skipped += 1;
      continue;
    }

    let parentId = parentMap.get(parentTitle) ?? null;

    if (!parentId) {
      const parentExternalId = buildExternalId(parentTitle);
      const parentCategory = await prisma.marketplaceCategory.upsert({
        where: {
          source_externalId: {
            source: TaxonomySource.MARKETPLACE,
            externalId: parentExternalId
          }
        },
        update: {
          parentId: null,
          title: parentTitle,
          fullPath: parentTitle,
          level: 0,
          isLeaf: false,
          isActive: true
        },
        create: {
          source: TaxonomySource.MARKETPLACE,
          externalId: parentExternalId,
          parentId: null,
          title: parentTitle,
          fullPath: parentTitle,
          level: 0,
          isLeaf: false,
          isActive: true
        }
      });

      parentId = parentCategory.id;
      parentMap.set(parentTitle, parentCategory.id);
      parentCount += 1;
    }

    if (!childTitle) {
      continue;
    }

    const childExternalId = buildExternalId(parentTitle, childTitle);

    await prisma.marketplaceCategory.upsert({
      where: {
        source_externalId: {
          source: TaxonomySource.MARKETPLACE,
          externalId: childExternalId
        }
      },
      update: {
        parentId,
        title: childTitle,
        fullPath: `${parentTitle} / ${childTitle}`,
        level: 1,
        isLeaf: true,
        isActive: true
      },
      create: {
        source: TaxonomySource.MARKETPLACE,
        externalId: childExternalId,
        parentId,
        title: childTitle,
        fullPath: `${parentTitle} / ${childTitle}`,
        level: 1,
        isLeaf: true,
        isActive: true
      }
    });

    childCount += 1;
  }

  console.log("Импорт категорий завершён.");
  console.log(`Родительских категорий: ${parentCount}`);
  console.log(`Дочерних категорий: ${childCount}`);
  console.log(`Пропущенных строк: ${skipped}`);
}

main()
  .catch((error) => {
    console.error("Ошибка импорта категорий:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });