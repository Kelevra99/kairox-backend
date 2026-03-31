import { Injectable } from "@nestjs/common";
import { dialogChannels, dialogTemplates, reviews } from "@/shared/mock-data/store.seed";

@Injectable()
export class DialogsService {
  getChannels() {
    return dialogChannels;
  }

  getTemplates() {
    return dialogTemplates;
  }

  getQuestions() {
    return [
      { id: 1, title: "Совместимость аксессуаров" },
      { id: 2, title: "Сроки доставки" },
      { id: 3, title: "Как выбрать мультитул" }
    ];
  }

  getReviews() {
    return reviews;
  }
}
