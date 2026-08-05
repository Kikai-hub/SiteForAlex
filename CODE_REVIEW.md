# Код-ревью — Adana Pizza (курьерская доставка)

Дата: 2026-08-05

Это работа над ошибками по предыдущему ревью курьерской фичи. Все 5
находок предыдущего прохода (`claimOrder` без проверки статуса,
осиротение заказов при удалении курьера, module-scope проверка
`SESSION_SECRET`, open redirect на трёх страницах логина, дублирующаяся
Zod-схема) исправлены — см. «Исправленные находки» ниже. Новых находок
при повторном просмотре изменённых файлов не выявлено.

---

## Исправленные находки

### 1. `claimOrder` не проверял статус заказа

**Файл:** `app/courier/(dashboard)/actions.ts`

В `WHERE`-условие `claimOrder` добавлена проверка `status: { notIn:
["CANCELLED", "DELIVERED"] }` — то же условие, что уже используется при
выборке списка «доступных» заказов на `app/courier/(dashboard)/page.tsx`.
Теперь `updateMany` не найдёт строку для отменённого/доставленного заказа
и `claimOrder` вернёт `{ error: "Заказ уже забрал другой курьер" }` вместо
того, чтобы вернуть его в `OUT_FOR_DELIVERY`.

### 2. Удаление курьера с активной доставкой осиротяло заказ

**Файлы:** `app/admin/(dashboard)/couriers/actions.ts`,
`components/admin/DeleteCourierButton.tsx`

`deleteCourier` теперь сначала считает
`prisma.order.count({ where: { courierId: id, status: "OUT_FOR_DELIVERY" } })`
и, если результат не нулевой, возвращает
`{ error: "У курьера есть заказы в пути — сначала передайте их другому курьеру" }`,
не выполняя удаление. `DeleteCourierButton` обновлён: он теперь читает
результат server action и показывает эту ошибку под кнопкой.

### 3. Проверка `SESSION_SECRET` выполнялась на уровне модуля

**Файл:** `lib/auth/session.ts`

Проверка перенесена из module-scope в ленивую функцию `getSecret()`,
которая выполняется (и кеширует секрет) только при первом реальном
`signSession`/`verifySession`, а не при импорте модуля. `next build`
(«Collecting page data») больше не может упасть из-за отсутствия
`SESSION_SECRET` в build-окружении — ошибка возникает только при
попытке реально подписать/проверить сессию в рантайме без секрета.

### 4. Open redirect через параметр `next`

**Файлы:** `lib/safe-redirect.ts` (новый),
`app/courier/login/page.tsx`, `app/admin/login/page.tsx`,
`app/(site)/login/page.tsx`

Добавлен общий хелпер `safeRedirectPath(target, fallback)`, который
принимает `next` только если это внутренний путь (`startsWith("/")` и не
`startsWith("//")`), иначе возвращает `fallback`. Применён во всех трёх
местах логина вместо прямого `params.get("next") || "/…"`.

### 5. `courierLoginSchema` дублировал `adminLoginSchema`

**Файл:** `lib/validation/auth.ts`

Обе схемы теперь ссылаются на одну общую `usernamePasswordLoginSchema`;
публичные экспорты `adminLoginSchema` и `courierLoginSchema` сохранены
как алиасы, так что вызывающий код (`app/api/auth/admin/login/route.ts`,
`app/api/auth/courier/login/route.ts`) не менялся.

---

## Проверка

`npx tsc --noEmit` — без ошибок после всех правок.
