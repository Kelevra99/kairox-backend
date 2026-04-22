import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";

export class CreateSiteCategoryDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(160)
  slug!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  mappedMarketplaceCategoryId?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageAlt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
