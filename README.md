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
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

Открыть:
- API: http://localhost:3101/api/v1
- Health: http://localhost:3101/api/v1/health

## Переменные окружения
```env
PORT=3101
FRONTEND_URL=http://localhost:3100
```

## Почему такая база
Пользователь просил быстрый локальный старт с перспективой роста:
- хранение фото и характеристик
- управление доставкой
- онлайн-оплата
- интеграции со службами доставки
- управляемый внешний вид сайта

Поэтому здесь не просто пустой Nest-проект, а уже нормальный каркас для расширения.
