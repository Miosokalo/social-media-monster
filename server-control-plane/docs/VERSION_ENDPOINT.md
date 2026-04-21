# Version-Endpoint (Konvention)

Jede ausgelieferte App sollte einen **JSON**-Endpoint bereitstellen, den das Control Plane aus `version.url` abruft.

## Empfohlene URL

- `GET /api/version` oder `GET /api/health` (wenn dort Version mit ausgeliefert wird)

## JSON-Formate (beliebig erweiterbar)

Mindestens eines der folgenden Felder sollte gesetzt sein:

| Feld | Bedeutung |
|------|-----------|
| `commit` oder `sha` oder `gitSha` | Vollständiger Git-Commit-Hash des Builds |
| `shortCommit` | Optional; sonst ersten 7 Zeichen von `commit` nutzen |
| `buildTime` oder `builtAt` | ISO-Zeitstempel des Builds |
| `version` | Semver oder Anzeige-String |

### Beispiel

```json
{
  "commit": "a1b2c3d4e5f6...",
  "buildTime": "2026-04-21T12:00:00.000Z",
  "version": "1.4.2"
}
```

## Implementierung

- Setze die Werte zur **Build-Zeit** (z. B. `ARG GIT_SHA` im `Dockerfile`, oder `NEXT_PUBLIC_GIT_SHA` bei Next.js).
- Trage im Control Plane unter `projects[].version.url` die vollständige HTTPS-URL zu diesem Endpoint ein.
