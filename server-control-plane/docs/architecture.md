# Architektur: server-control-plane

## Zweck

Browser-Dashboard zur Übersicht über mehrere Projekte auf einem Server: Erreichbarkeit, CI-Status (GitHub Actions), optional Live-Version per JSON-Endpoint, Commits, Datei `recommended_steps` aus dem Repo, sowie Webhooks für Deploy-Events und Support-/Feedback-Tickets.

## Laufzeit

- **Next.js** (App Router), Node.js 20.
- **Konfiguration**: YAML `config/projects.yaml` (siehe `projects.example.yaml`).
- **Persistenz**: JSON-Datei unter `CONTROL_PLANE_DATA_DIR` (Tickets, Deploy-Historie).
- **GitHub**: REST API mit `GITHUB_TOKEN` für Commits, Actions-Runs und Dateiinhalte.
- **System**: RAM- und Dateisystem-Auslastung werden **serverseitig** im Node-Prozess ermittelt (`os`, `fs.statfs`). Unter Docker entspricht das dem **Container** (nicht dem Host), sofern keine Host-Pfade gemountet sind. Pfade für `statfs` über `SYSTEM_DISK_PATHS` (kommagetrennt, Standard `/`).

## Netzwerk / Sicherheit

- Öffentlicher Zugriff nur mit **Reverse Proxy + Auth** (z. B. Caddy Basic Auth oder SSO); siehe `docs/CADDY.md` und `deploy/Caddyfile.example`.
- Webhooks akzeptieren optional HMAC (`X-Control-Plane-Signature`); ohne gesetztes Secret sind Endpoints im Internet **nicht** empfohlen.

## Docker

- `Dockerfile`: Multi-Stage Build, `output: standalone`.
- `docker-compose.yml`: baut den Service, bindet `config/projects.yaml` und Volume für `/app/data`.

## API (Auswahl)

| Methode | Pfad | Beschreibung |
|---------|------|----------------|
| GET | `/api/health` | Liveness |
| GET | `/api/projects` | Alle Projekte aggregiert |
| GET | `/api/projects/:id` | Detail |
| POST | `/api/webhooks/deploy` | Deploy-/Build-Status |
| POST | `/api/webhooks/ticket` | Ticket/Feedback |
| GET | `/api/metrics/host` | JSON wie System-Übersicht; nur wenn `CONTROL_PLANE_EXPOSE_HOST_METRICS=true` |
| GET | `/system` | UI: RAM, FS, Load, Drill-down (Details/JSON) |
