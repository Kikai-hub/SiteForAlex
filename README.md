# Adana Pizza

Сайт пиццерии Adana Pizza: витрина меню с заказом, личный кабинет клиента и админ-панель для управления меню, скидками и заказами.

## Стек

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Prisma 7** + SQLite (`better-sqlite3` driver adapter)
- Аутентификация: телефон+пароль (клиенты) и логин+пароль (админ) — httpOnly JWT-сессии (`jose`), пароли — `bcryptjs`
- Корзина — `zustand` (localStorage)
- Загрузка фото/видео блюд — локально в `public/uploads/`

## Разработка

```bash
npm install
npm run db:migrate   # применить миграции (первый запуск создаст dev.db)
npm run db:seed       # засеять категории/блюда/админа/промокод из .env
npm run dev
```

Сайт: http://localhost:3000
Админ-панель: http://localhost:3000/admin/login

Логин администратора по умолчанию задаётся переменными `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` в `.env` (см. `.env.example`). **Смените пароль перед продакшеном.**

## Структура

- `app/(site)/` — публичный сайт: главная, меню, карточка блюда, корзина, оформление заказа, личный кабинет
- `app/admin/` — админ-панель (защищена мидлваром `proxy.ts`)
- `app/api/` — route handlers: аутентификация, заказы, промокоды, загрузка медиа
- `prisma/schema.prisma` — модель данных; `prisma/seed.ts` — админ/промокод для первого запуска; `prisma/seed-data/` + `prisma/seed-initial-menu.ts` — стартовое меню (см. DEPLOY.md)
- `lib/` — общая логика: Prisma-клиент, аутентификация, валидация (zod), расчёт промокодов, загрузка файлов

## Продакшен-деплой

Готовый Docker-стек с автообновлением с GitHub — см. **[DEPLOY.md](DEPLOY.md)**.

Важно:

- Медиафайлы блюд хранятся на локальном диске (`public/uploads/`) — для этого нужен постоянный Node-процесс (VPS/Docker), **не** serverless-хостинг вроде Vercel с бессерверной ФС.
- Оплата — наличными/картой курьеру, либо картой онлайн через ЮKassa (нужны `YOOKASSA_SHOP_ID`/`YOOKASSA_SECRET_KEY` в `.env`, см. `.env.example`).
- Регистрация клиента — по телефону и паролю без SMS-подтверждения.
- Задайте случайный `SESSION_SECRET` и смените пароль администратора перед публикацией (`install.sh` делает это за вас — см. DEPLOY.md).
