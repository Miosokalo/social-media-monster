# Plattform-App-Reviews (Kurz-Checklisten)

Vor Go-Live pro Netzwerk Developer-Account, Nutzungsbedingungen und Kosten klären.

## Meta (Facebook / Instagram)

- [ ] Meta Developer App angelegt, App-Modus (Live) und erforderliche Permissions (`pages_manage_posts`, o. ä. je Produkt).
- [ ] OAuth Redirect-URIs exakt wie in der Konfiguration (`META_*` / Callback-URL).
- [ ] Seiten-Zugriff: Nutzer als Admin/Test-User; Business-Verifizierung falls nötig.
- [ ] Video-/Bild-Limits und Carousel-Flows gegen API-Doku testen.

## LinkedIn

- [ ] LinkedIn Developer App, produktive OAuth-Scopes für Posts.
- [ ] Organisation vs. persönliches Konto klären (API-Unterschiede).

## X (Twitter)

- [ ] API-Tier und Kosten (Basic/Pro/Enterprise) gegen geplantes Posting-Volumen.
- [ ] Rate Limits und Media-Upload-Endpunkte prüfen.

## TikTok

- [ ] App Review / Content Posting API — Zugang oft eingeschränkt; früh einplanen.

## Allgemein

- [ ] Datenschutz: welche Nutzer-/Seiten-Daten werden gespeichert (Tokens verschlüsselt).
- [ ] Support-FAQ: typische Fehlercodes mit Nutzerhinweis (Runbooks).
