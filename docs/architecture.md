# Architektur (lokal / Entwicklung)

## Services (Docker Compose)

| Service  | Port | Zweck |
|----------|------|--------|
| Postgres | 5432 | App-Daten (Drizzle-Migrationen unter `apps/web/drizzle/`) |
| Redis    | 6379 | BullMQ: Publishing-Queue, DLQ, verzögerte Jobs |

Siehe [docker-compose.yml](../docker-compose.yml) im Repository-Root.

## Anwendung (`apps/web`)

- **Framework:** Next.js 15 (App Router), NextAuth (Credentials + JWT), Drizzle ORM.
- **Publishing:** `publish-runner` + BullMQ-Worker (`apps/web/src/workers/publish-worker.ts`); geplante Posts: `POST /api/cron/process-scheduled` mit `Authorization: Bearer <CRON_SECRET>` (ohne Redis: nur DB-Status).
- **Plattformen:** Demo-Adapter; Meta/LinkedIn/X-Publisher über Registry; OAuth: `/api/oauth/meta/*`, `/api/oauth/linkedin/*`, `/api/oauth/x/*`, generischer Einstieg `/api/oauth/[platform]/start` (Redirects). Multi-Page-Meta: Session `/settings/oauth-meta-pick`.
- **Cron (Bearer `CRON_SECRET`):** `process-scheduled`, `refresh-tokens`, `analytics-ingest`, `retention` (Chat 90 Tage).
- **Tokens:** `accessTokenEnc` / `refreshTokenEnc` verschlüsselt (`ENCRYPTION_KEY` oder Fallback aus `AUTH_SECRET`).
- **Medien:** `storage.ts` — S3-kompatibel wenn `S3_*` gesetzt, sonst lokal `.data/uploads`; optional Thumbnails (sharp).
- **Billing:** Stripe Checkout/Portal, Webhook `/api/stripe/webhook`; Kontingente in `lib/quota.ts` / `lib/limits.ts`.
- **Observability:** strukturierte Logs `lib/logger.ts`; Health `GET /api/health` (DB, Redis, Queue-Counts); `x-request-id` via Middleware; Admin `GET /api/admin/queues`.
- **Compliance:** Account-Löschung `DELETE /api/account`; Audit-Log-Tabelle `audit_logs`.

Shared Env-Schema: `packages/shared/src/env.ts`.

## Weitere Doku

- [Runbooks (Betrieb)](runbooks.md)
- [Plattform-App-Reviews](platform-review-checklists.md)

Reverse-Proxy / Produktions-Deploy: nicht Teil dieses Repos (lokal: `npm run dev -w web`).
