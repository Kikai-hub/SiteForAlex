# Adana Pizza

Сайт пиццерии Adana Pizza: витрина меню с заказом, личный кабинет клиента и админ-панель для управления меню, скидками и заказами.

## Стек

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4), запускается под **PM2** в cluster mode — по одному воркеру на каждое ядро CPU
- **Prisma 7** + **PostgreSQL** (`pg` driver adapter, пул соединений)
- **Redis** — общий кеш меню/промокодов между всеми PM2-воркерами (см. `cache-handler.js`) и счётчики rate-limit'а (см. `lib/rateLimit.ts`)
- Аутентификация: телефон+пароль (клиенты) и логин+пароль (админ) — httpOnly JWT-сессии (`jose`), пароли — `bcryptjs`
- Корзина — `zustand` (localStorage)
- Загрузка фото/видео блюд — локально в `public/uploads/`

## Разработка

Нужны запущенные Postgres и Redis — проще всего через Docker:

```bash
docker compose up -d postgres redis
```

Затем:

```bash
npm install
npm run db:migrate   # применить миграции
npm run db:seed       # засеять категории/блюда/админа/промокод из .env
npm run dev
```

`.env` (см. `.env.example`) должен указывать на них, например:
`DATABASE_URL="postgresql://adana:adana@localhost:5432/adana_pizza"`,
`REDIS_URL="redis://localhost:6379"`.

Сайт: http://localhost:3000
Админ-панель: http://localhost:3000/admin/login

Логин администратора по умолчанию задаётся переменными `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` в `.env` (см. `.env.example`). **Смените пароль перед продакшеном.**

## Структура

- `app/(site)/` — публичный сайт: главная, меню, карточка блюда, корзина, оформление заказа, личный кабинет
- `app/admin/` — админ-панель (защищена мидлваром `proxy.ts`)
- `app/api/` — route handlers: аутентификация, заказы, промокоды, загрузка медиа
- `prisma/schema.prisma` — модель данных; `prisma/seed.ts` — админ/промокод для первого запуска; `prisma/seed-data/` + `prisma/seed-initial-menu.ts` — стартовое меню (см. DEPLOY.md)
- `lib/` — общая логика: Prisma-клиент, аутентификация, валидация (zod), расчёт промокодов, загрузка файлов

## Тесты

- `npm test` — юнит-тесты (Vitest) на чистую бизнес-логику: нормализация телефона,
  расчёт денег, `safeRedirectPath` (open-redirect фикс), Zod-схемы валидации. Не
  требуют БД/Redis.
- `npm run test:e2e` — сквозные тесты (Playwright): просмотр меню, добавление в
  корзину, гостевой заказ, регистрация/вход, rate-limit логина, чекбокс согласия
  на обработку персональных данных. Гоняются **против уже поднятого сайта**
  (по умолчанию `http://localhost`, см. `BASE_URL` в `playwright.config.ts`) —
  сначала `docker compose up -d`, при первом запуске `npx playwright install
  chromium`.

Оба набора создают тестовые заказы/аккаунты в реальной БД — на постоянном
стенде их стоит подчищать после прогона (см. `bin/adanasite` для примера прямых
SQL-запросов через `psql`).

## Продакшен-деплой

Готовый Docker-стек с автообновлением с GitHub — см. **[DEPLOY.md](DEPLOY.md)**.

Важно:

- Медиафайлы блюд хранятся на локальном диске (`public/uploads/`) — для этого нужен постоянный Node-процесс (VPS/Docker), **не** serverless-хостинг вроде Vercel с бессерверной ФС.
- Оплата — наличными/картой курьеру, либо картой онлайн через ЮKassa (нужны `YOOKASSA_SHOP_ID`/`YOOKASSA_SECRET_KEY` в `.env`, см. `.env.example`).
- Регистрация клиента — по телефону и паролю без SMS-подтверждения.
- Задайте случайный `SESSION_SECRET` и смените пароль администратора перед публикацией (`install.sh` делает это за вас — см. DEPLOY.md).
