import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>("port", 3101);
  }

  get nodeEnv(): string {
    return this.configService.get<string>("nodeEnv", "development");
  }

  get frontendUrl(): string {
    return this.configService.get<string>("frontendUrl", "http://localhost:3100");
  }

  get databaseUrl(): string {
    return this.configService.get<string>("databaseUrl", "");
  }

  get redisUrl(): string {
    return this.configService.get<string>("redisUrl", "");
  }

  get assetBaseUrl(): string {
    return this.configService.get<string>("assetBaseUrl", `http://localhost:${this.port}`);
  }
}
