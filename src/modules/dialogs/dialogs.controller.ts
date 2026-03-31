import { Controller, Get } from "@nestjs/common";
import { DialogsService } from "./dialogs.service";

@Controller("dialogs")
export class DialogsController {
  constructor(private readonly dialogsService: DialogsService) {}

  @Get("channels")
  getChannels() {
    return this.dialogsService.getChannels();
  }

  @Get("templates")
  getTemplates() {
    return this.dialogsService.getTemplates();
  }

  @Get("questions")
  getQuestions() {
    return this.dialogsService.getQuestions();
  }

  @Get("reviews")
  getReviews() {
    return this.dialogsService.getReviews();
  }
}
