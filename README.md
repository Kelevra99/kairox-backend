# KaiRox Backend

Бэкенд интернет-магазина KaiRox на NestJS + Fastify + Prisma.

## Что уже заложено
- быстрый HTTP сервер на Fastify
- модульная структура под магазин и админку
- REST API `/api/v1/...`
- Prisma schema под товары, фото, остатки, заказы, клиентов, отзывы, доставку, темы сайта и баннеры
- docker-compose для Postgres и Redis
- сидовые mock-данные для быстрого старта фронтенда

## Модули
- Health
- Dashboard
- Orders
- Products
- Reviews
- Delivery
- Promotion
- Customers
- Dialogs
- Site Settings

## Порт по умолчанию
Бэкенд сразу настроен на порт `3101`, чтобы не конфликтовать с уже занятыми `3000/3001`.

## Запуск
```bash
cp .env.example .env
docker compose up -d
npm install
npm run fonts:bootstrap
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

### Важно про шрифты
Команда `npm run fonts:bootstrap` обязательна при первой установке проекта.

Она:
- скачивает Google Fonts, которые используются сайтом и редакторами дизайна
- сохраняет их локально в `../frontend/public/fonts/google`
- генерирует локальный CSS-файл `fonts.css` и `manifest.json`

Без этого шага кастомные шрифты могут не подтянуться или будут заменяться системными шрифтами.

Если шрифты уже были загружены ранее, команду можно запускать повторно — недостающие файлы будут докачаны, существующие переиспользуются.

Открыть:
- API: http://localhost:3101/api/v1
- Health: http://localhost:3101/api/v1/health

## Переменные окружения
```env
PORT=3101
FRONTEND_URL=http://localhost:3100
```

## Полный первый запуск с нуля
```bash
cp .env.example .env
docker compose up -d
npm install
npm run fonts:bootstrap
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

После этого отдельно запусти фронтенд из папки `frontend`, чтобы сайт и админка использовали уже локально сохранённые шрифты.

## Почему такая база
Пользователь просил быстрый локальный старт с перспективой роста:
- хранение фото и характеристик
- управление доставкой
- онлайн-оплата
- интеграции со службами доставки
- управляемый внешний вид сайта

Поэтому здесь не просто пустой Nest-проект, а уже нормальный каркас для расширения.
