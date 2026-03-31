import { IsHexColor, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brandName?: string;

  @IsOptional()
  @IsHexColor()
  bg?: string;

  @IsOptional()
  @IsHexColor()
  panel?: string;

  @IsOptional()
  @IsHexColor()
  primary?: string;

  @IsOptional()
  @IsHexColor()
  primaryStrong?: string;

  @IsOptional()
  @IsHexColor()
  text?: string;

  @IsOptional()
  @IsHexColor()
  textSoft?: string;
}
