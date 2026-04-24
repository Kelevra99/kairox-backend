import "reflect-metadata";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
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

  const uploadsRoot = join(process.cwd(), "uploads");
  await mkdir(uploadsRoot, { recursive: true });

  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: 25 * 1024 * 1024
    }
  });

  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: "/uploads/"
  });

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
