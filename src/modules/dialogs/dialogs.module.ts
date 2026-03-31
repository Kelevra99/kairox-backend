import { Module } from "@nestjs/common";
import { DialogsController } from "./dialogs.controller";
import { DialogsService } from "./dialogs.service";

@Module({
  controllers: [DialogsController],
  providers: [DialogsService]
})
export class DialogsModule {}
