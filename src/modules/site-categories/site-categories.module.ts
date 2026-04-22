import { Module } from "@nestjs/common";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { SiteCategoriesController } from "./site-categories.controller";
import { SiteCategoriesService } from "./site-categories.service";

@Module({
  imports: [PrismaModule],
  controllers: [SiteCategoriesController],
  providers: [SiteCategoriesService]
})
export class SiteCategoriesModule {}