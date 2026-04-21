import { Allow, IsOptional } from "class-validator";

export class UpdateAdminThemeDto {
  @IsOptional()
  @Allow()
  settings?: Record<string, unknown>;
}
