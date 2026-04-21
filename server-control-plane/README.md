# server-control-plane

Browser-Dashboard für einen Server mit mehreren Projekten (Docker Compose + Caddy): **Erreichbarkeit**, **GitHub Actions**, **Commits**, **`recommended_steps`**, **Live-Version** (JSON-Endpoint), **Deploy-Webhooks** und **Ticket-Webhooks**.

## Schnellstart (lokal)

1. Abhängigkeiten: `npm ci`
2. `cp config/projects.example.yaml config/projects.yaml` und anpassen.
3. Optional `.env` aus `.env.example` — für private Repos und höhere API-Limits: `GITHUB_TOKEN` setzen.
4. `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Docker Compose

```bash
cp .env.example .env
# .env bearbeiten (GITHUB_TOKEN, ggf. Secrets für Webhooks)
docker compose up -d --build
```

Standard-Port nach außen: **3040** → Container **3000** (`CONTROL_PLANE_PORT`).

## System-Ansicht

- Startseite: kompakte **RAM- und FS-Leiste** (Hostname), Klick öffnet **`/system`** (Layout für ca. 14″: große Kennzahlen, optional weitere Einhängepunkte, CPU/Last und JSON per Aufklappen).
- **`SYSTEM_DISK_PATHS`**: z. B. `/` oder `/,/data` (kommagetrennt). Unter Docker misst `statfs` den gemounteten Pfad im Container.

## Konfiguration (`config/projects.yaml`)

- **`id`**: eindeutige Kennung (URL: `/project/:id`).
- **`urls.public`**: öffentliche URL (Health-Check, falls kein `healthCheck`).
- **`version.url`**: optional, JSON siehe [docs/VERSION_ENDPOINT.md](docs/VERSION_ENDPOINT.md).
- **`recommendedStepsPath`**: Pfad im Repo (z. B. `recommended_steps.md`).
- **`ci.workflowFile` / `ci.workflowName`**: optional, um den passenden Actions-Lauf zu finden.

## Webhooks

JSON-Body siehe Implementierung in `app/api/webhooks/*/route.ts`.

- Header bei gesetztem Secret: `X-Control-Plane-Signature: sha256=<hex>` (HMAC-SHA256 über den **rohen** JSON-Body).

## Reverse Proxy

Siehe [docs/CADDY.md](docs/CADDY.md) und `deploy/Caddyfile.example`.

## Architektur

Siehe [docs/architecture.md](docs/architecture.md).
