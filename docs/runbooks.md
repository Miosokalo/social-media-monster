# Runbooks (Publishing & Queue)

## Post bleibt auf „scheduled“ / wird nicht verarbeitet

1. **Redis:** Ohne `REDIS_URL` werden keine BullMQ-Jobs eingereiht; nur Cron kann fällige Posts auf `queued` setzen (`/api/cron/process-scheduled` mit `CRON_SECRET`).
2. **Worker:** `publish-worker` muss laufen (`npm run worker -w web` o. ä., siehe `package.json`).
3. **Zeit:** `scheduledFor` in der Zukunft → verzögerte Job-Verzögerung prüfen (`enqueuePublish` mit `delayMs`).

## Post landet in „failed“

1. Logs mit `request_id` / `workspace_id` (`lib/logger`) prüfen.
2. **Token:** Abgelaufenes OAuth-Token → Nutzer muss Konto neu verbinden; Refresh-Job/Cron ergänzen falls noch nicht produktiv.
3. **Plattform:** Rate Limits / Policy — Fehlermeldung aus Publisher-Mapping lesen (Meta/LinkedIn/X).

## DLQ

- Nach mehreren Fehlversuchen geht der Job in die Dead-Letter-Queue (BullMQ). Manueller Retry über Queue-Monitoring oder erneutes Enqueue der `scheduled_posts.id`.

## Health

- `GET /api/health` — `redis: optional_missing` ist in Dev ok; in Production sollte Redis konfiguriert sein.

## Cron

- Geplante Posts regelmäßig triggern (z. B. alle Minute): `Authorization: Bearer $CRON_SECRET`.
