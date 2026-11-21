# Cleaning App

MVP веб-приложения для выездной химчистки мягкой мебели.

## Локальный запуск

Требуются Node.js 20+, npm и Docker Desktop.

1. Установить зависимости:

   ```bash
   npm install
   ```

2. Создать `.env` на основе `.env.example`.

   Обязательно задайте:

   - `DATABASE_URL`;
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — те же данные, что используются в `DATABASE_URL`;
   - случайные `AUTH_SECRET` и `CRON_SECRET`;
   - случайный `PUBLIC_TOKEN_SECRET` длиной не менее 32 символов;
   - `AUTH_URL` для адреса приложения.

   Не коммитьте `.env` и не используйте стандартные пароли.

3. Запустить PostgreSQL:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

   Dev override публикует PostgreSQL только на `127.0.0.1`, поэтому приложение на хосте может подключаться к нему, но БД не доступна через внешний сетевой интерфейс.

4. Применить миграции и создать тестовые данные. Для создания нового bootstrap-владельца задайте `BOOTSTRAP_ADMIN_EMAIL` и сильный `BOOTSTRAP_ADMIN_PASSWORD` в `.env` или только на время запуска:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Legacy public tokens уже переведены в SHA-256 hash отдельной миграцией/backfill-процедурой. Runtime использует только hash lookup.

   Seed не изменяет пароль уже существующего OWNER. Если bootstrap-переменные отсутствуют или пароль не проходит требования, seed завершается ошибкой до операций записи. После создания владельца bootstrap-переменные можно удалить из локального `.env`.

5. Запустить приложение:

   ```bash
   npm run dev
   ```

Открыть `http://localhost:3000`.

## Production deployment

- Используйте `docker-compose.yml` без dev override: в этой конфигурации PostgreSQL не публикует порт, использует приватную internal network и обязательные `POSTGRES_*` переменные.
- Приложение в production compose должно быть подключено к сети `db-internal` и обращаться к сервису `db:5432`.
- HSTS не включён по умолчанию. Устанавливайте `ENABLE_HSTS="true"` только когда приложение гарантированно опубликовано по HTTPS.
- TLS обычно завершается на reverse proxy. Настройте proxy rate limits, trusted proxy headers и запрет внешнего доступа к PostgreSQL.

## Proxy trust и rate limiting

Запускайте приложение через `npm run dev` или `npm run start`. Эти команды используют `server.mjs`, который подписывает реальный IP сокета внутренним process-local ключом. Route Handlers не принимают клиентский `X-Forwarded-For` как адрес клиента.

- `TRUST_PROXY=false` — используется только подписанный прямой адрес peer.
- `TRUST_PROXY=true` — proxy headers учитываются, только если прямой peer входит в `TRUSTED_PROXIES`.
- `TRUSTED_PROXIES` принимает IP через запятую и IPv4 CIDR.
- Reverse proxy должен перезаписывать, а не слепо дополнять `X-Forwarded-For`.
- Если `X-Forwarded-For` содержит пустой или некорректный IP, вся цепочка отклоняется и используется direct peer IP.

Встроенные лимиты:

| Операция | Лимит |
|---|---|
| Вход администратора по IP | 10 за 15 минут на IP |
| Вход администратора по email | 30 за 15 минут на HMAC от normalized email |
| Создание заявки | 8 за 10 минут на IP |
| Загрузка фото | 12 за 10 минут на IP |
| Публичный просмотр заказа | 120 за минуту на IP |

Ответ ограничения — `429` с `Retry-After`. Счётчики атомарно хранятся в PostgreSQL `RateLimitCounter`; ключи являются HMAC-хешами и не содержат открытый IP, email или token. Email проверяется после IP-лимита и не запрашивает БД, поэтому ответ не раскрывает существование аккаунта.

## Проверки

```bash
npm run typecheck
npm run lint
npm run test:pricing
npm run build
```

## Фотографии

Фотографии сохраняются вне публичной папки в каталоге `.storage/uploads`. Временные загрузки живут 24 часа. Для удаления незавершённых загрузок нужно настроить ежедневный GET-запрос к `/api/cron/cleanup-uploads` с заголовком `Authorization: Bearer <CRON_SECRET>`.

Текущая реализация хранилища рассчитана на локальный диск одного постоянно работающего экземпляра приложения. Для production-развёртывания на нескольких экземплярах или на платформе с эфемерной файловой системой перед запуском подключите постоянный приватный диск либо S3-совместимое хранилище и настройте резервное копирование фотографий и PostgreSQL.
