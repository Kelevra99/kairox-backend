import { IsHexColor, IsOptional } from "class-validator";

export class UpdateAdminThemeDto {
  @IsOptional()
  @IsHexColor()
  shellBg?: string;

  @IsOptional()
  @IsHexColor()
  sidebarBg?: string;

  @IsOptional()
  @IsHexColor()
  panel?: string;

  @IsOptional()
  @IsHexColor()
  panelStrong?: string;

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
