import { Allow, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brandName?: string;

  @IsOptional()
  @Allow()
  colors?: Record<string, unknown>;

  @IsOptional()
  @Allow()
  appearance?: Record<string, unknown>;
}
