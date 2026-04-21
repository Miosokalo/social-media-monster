# Nächste Schritte (Social Media Monster auf Webstack)

## Produktion (Hetzner)

1. **`/srv/webstack/.env`:** `SMM_DATABASE_URL` (Host `postgres`, Port `5432`, eigene DB), `SMM_AUTH_SECRET` (mindestens 32 Zeichen). Optional: `SMM_AUTH_URL` (Default `https://social-media-monster.orga-hero.com`), `SMM_REDIS_URL`, `SMM_OPENAI_API_KEY`.
2. **Datenbank einmalig:**  
   `docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c 'CREATE DATABASE social_media_monster;'`  
   URL in `SMM_DATABASE_URL` muss zu User/Passwort/DB passen.
3. **Deploy:** `bash /srv/webstack/scripts/sync-social-media-monster.sh`
4. **Schema:** Im Container (oder lokal gegen gleiche DB): `cd apps/web && npx drizzle-kit push` (siehe Projekt-README).
5. **DNS:** `social-media-monster.orga-hero.com` → A/AAAA wie andere Subdomains unter `orga-hero.com`.

## Code

- Build nutzt `SKIP_ENV_VALIDATION` nur im Docker-Build; zur Laufzeit gilt die normale Zod-Validierung.
- Cron-/OAuth-URLs müssen zur öffentlichen **`SMM_AUTH_URL`** passen.

## Risiko / Folgen

- Ohne gesetzte `SMM_*` in `.env` schlägt `docker compose` beim Parsen fehl (wie bei Solawi mit Pflichtvariablen).
- Next.js 15.2.4: Security-Advisory CVE-2025-66478 — bei Gelegenheit patchen.
