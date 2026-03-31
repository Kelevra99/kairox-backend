import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>("port", 3001);
  }

  get nodeEnv(): string {
    return this.configService.get<string>("nodeEnv", "development");
  }

  get frontendUrl(): string {
    return this.configService.get<string>("frontendUrl", "http://localhost:3000");
  }

  get databaseUrl(): string {
    return this.configService.get<string>("databaseUrl", "");
  }

  get redisUrl(): string {
    return this.configService.get<string>("redisUrl", "");
  }
}
