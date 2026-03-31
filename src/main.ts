import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import cors from "@fastify/cors";
import { AppModule } from "./app.module";
import { AppConfigService } from "./modules/config/app-config.service";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false
    })
  );

  const config = app.get(AppConfigService);

  await app.register(cors, {
    origin: [config.frontendUrl],
    credentials: true
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  await app.listen(config.port, "0.0.0.0");
  console.log(`KaiRox backend started on http://localhost:${config.port}/api/v1`);
}

bootstrap();
