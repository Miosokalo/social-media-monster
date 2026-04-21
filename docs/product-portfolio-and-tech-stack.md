# Social Media Creation & Distribution — Produktportfolio, Features & Tech-Stack

Dieses Dokument fasst die **Produktvision**, das **Projektportfolio** (Scope in Phasen), eine **priorisierte Feature-Liste** (inkl. Best Practices von Marktführern und Spezialisten) und eine **recherchierte Tech-Stack-Empfehlung** zusammen. Es dient als Ausgangsbasis für Roadmap und Architekturentscheidungen.

---

## 1. Produktvision (Kurz)

**Ziel:** Eine Anwendung, in der Nutzer **mehrere Social-Media-Identitäten** (Marken, Kunden, persönliche Kanäle) **zentral** planen, erstellen, freigeben und **über mehrere Plattformen hinweg** veröffentlichen können — vergleichbar mit dem Fokus von [PostPlanify](https://postplanify.com/) (All-in-One für Creator/Teams/Agenturen), aber mit bewusster Übernahme starker Ideen von Buffer, Hootsuite, Sprout Social, Later und anderen.

**Kernversprechen:**

- Ein **Kalender + Editor** als Herzstück, nicht nur ein Posting-Tool.
- **Zuverlässiges Publishing** über offizielle APIs (kein „Grauzonen“-Scraping für das Kerngeschäft).
- **Kollaboration** (Rollen, Freigaben, Kommentare) ohne Enterprise-Zwang.
- **KI** als Beschleuniger (Captions, Varianten, Bildideen), nicht als Ersatz für strategische Kontrolle.
- **Volle Palette** für den Alltag: Erstellen → planen → **cross-plattform** veröffentlichen → **Reaktionen/Erwähnungen** bearbeiten → **moderieren** → **auswerten** — in einem durchgängigen Workflow (siehe Benchmark unten).

### Primärer Anwendungsfall (Projektinhaber)

| Aspekt | Zielbild |
|--------|-----------|
| **Social-Entitäten** | **4–7** klar getrennte Identitäten (Marken, Kanäle, „Personas“) im selben Workspace — jeweils mit eigenen verbundenen Plattform-Konten. |
| **Alltag** | Schnell Posts **erstellen**, auf **mehrere Plattformen** legen, **zeitgesteuert** oder sofort senden; danach **Interaktionen** zentral sehen und **moderieren**. |
| **Skalierung** | Mittelfristig **öffentliches SaaS** für weitere Nutzer — Architektur und Auth von Anfang an **multi-tenant-fähig** (siehe Abschnitt 2.1), ohne dass dein eigener produktiver Zugang von Abrechnung oder Limits abhängt. |

---

## 2. Projektportfolio — Was das Projekt umfasst

| Bereich | Inhalt |
|--------|--------|
| **Produkt** | Multi-Account-SMM-Plattform: Planung, Erstellung, Freigabe, Veröffentlichung, **Unified Inbox**, **Moderation**, Analytics & Reporting — **Creation + Distribution + Engagement** in einem Produkt. |
| **Zielgruppen** | Zuerst: du als Power-User mit mehreren Entitäten; parallel: **SaaS-Kunden** (Creator, kleine Teams, Agenturen) mit gleichen Kernflows. |
| **Abgrenzung** | Kein reines „nur Scheduler“-Tool. **Paid-Ads** und tiefes **Enterprise-Listening** (Markenüberwachung in News/Blogs weltweit) können **später** als Module kommen — Kern bleiben APIs der Netzwerke für Publishing, Kommentare, DMs (soweit erlaubt) und Insights. |
| **Erfolgskriterien (MVP)** | Mindestens 3–4 relevante Netzwerke zuverlässig anbinden; Kalender mit Drag-and-Drop; **Cross-Account-Ansicht**; Entwürfe speichern; geplantes Publishing; einfache Analytics pro Post/Kanal; **Inbox für eingehende Reaktionen** (mindestens eine Hauptplattform gut abdecken). |
| **Langfristige Säulen** | Verlässliche Infrastruktur (Queues, Retries), **Mandanten-/Workspace-Modelle**, **Moderations- und Automationsregeln**, API/Webhooks, optionale White-Label-Reports für Agenturen. |

### 2.1 SaaS & „immer funktionierender Zugang“ (Projektinhaber)

Damit die App **von Beginn** als Internet-Angebot ausgelegt werden kann — ohne dass Zahlungs-/Plan-Logik deinen eigenen Betrieb blockiert:

| Mechanismus | Zweck |
|-------------|--------|
| **Multi-Tenant-Datenmodell** | Jeder Kunde = eigener **Workspace** (Tenant); Daten strikt getrennt (`workspace_id` überall relevant). |
| **Rollen innerhalb Workspace** | Owner, Admin, Member, ggf. Read-only — gleiches Modell für dich und spätere Teams. |
| **Interne „Founder“- / Service-Konten** (nur Server-seitig gesetzt) | Ein oder wenige User-IDs mit **Bypass** für Billing-Limits und **Feature-Flags** (nur für dich/vertrauenswürdige Admins): volle Kontingente, kein Zahlungsausfall-Risiko für den produktiven Eigenbetrieb. |
| **Billing parallel** | Stripe (o. Ä.) für öffentliche Pläne; **dein Account** bleibt unabhängig über Founder-Flag oder separates **System-Workspace**. |
| **Deployment** | Eine produktive URL + Staging; CI/CD — du hast **immer** Zugriff auf Production (eigener Account + Monitoring). |

**Konsequenz für die Implementierung:** Registrierung/Login, Workspaces und **Subskriptions-Status** früh einziehen — nicht erst „irgendwann“ — aber **Limit-Checks** im Code so bauen, dass Founder/Service-Accounts ausgenommen werden können (sauber, auditierbar).

### Phasen (empfohlen)

1. **Phase 0 — Fundament:** Auth, **Multi-Tenant-Workspaces**, Billing-Hooks + **Founder-Bypass**, verbundene Konten **pro Entität**, Medienbibliothek, **Cross-Account-Kalender**-UI, Job-Queue fürs Publishing.
2. **Phase 1 — MVP Publishing:** 3–4 Plattformen (typisch Meta/IG/FB, LinkedIn, X — je nach API-Zugang und Policy), Scheduling, **Bulk-Scheduling** (minimal: mehrere Slots/Posts), Fehler- und Retry-Handling.
3. **Phase 2 — Creation & KI:** Rich Editor, Vorlagen, **KI-Pipelines** (Caption-Batches, Varianten), Plattform-spezifische Vorschauen; „**MyMarky-artig**“: Kampagnen-Ideen → mehrere Entwürfe gleichzeitig.
4. **Phase 3 — Team & Agentur:** Freigabe-Workflows, Kommentare am Entwurf, Rollen, ggf. Kunden-Portale light.
5. **Phase 4 — Inbox, Moderation & Insights:** **Unified Inbox** (Kommentare/Erwähnungen/DMs wo API erlaubt), **Moderationsregeln** (Schlüsselwörter, Auto-Zuweisung, Status), Dashboards, Exporte, Link-in-Bio light.
6. **Phase 5 — Monitoring & Automation:** **Social Listening light** (Keyword/Hashtag innerhalb der APIs), einfache **Automations** (z. B. bei Stichwort → Ticket/Benachrichtigung); öffentliche API, Webhooks; **SEO-/Local-Bundle** optional (z. B. Link/UTM-Hub, später GMB-ähnliche Kanäle nur wenn Priorität).

---

## 3. Benchmark: Genannte Tools — „Best of“ ins eigene Portfolio

Die folgende Tabelle fasst **typische Stärken** der von dir genannten Kategorien zusammen und mappt sie auf **konkrete Produktentscheidungen** für diese App.

### 3.1 All-in-One & Klassiker

| Tool | Typische Stärken (was Nutzer daran „hängen“) | Ins Portfolio übernehmen |
|------|-----------------------------------------------|---------------------------|
| **Hootsuite** | Viele Plattformen, **Branchen-Standard**-Gefühl, Planung, **Analytics**, **Teamarbeit**, **KI-Content** | Breite Plattform-Roadmap; **Team-Dashboards**; KI als Assistenz überall dort einbetten, wo Texte anfallen — nicht nur im Editor |
| **Sprout Social** | **Unified Inbox** (Kommentare/DMs gebündelt), **starke Analytics**, **Automatisierung**, professionelles Reporting | **Eine** Inbox-Ansicht mit Filtern pro Kanal/Entität; **Zuweisungen**; einfache Automations (Trigger → Aktion); exportierbare Reports |
| **Buffer** | **Radikal einfach**, günstiger Einstieg, Fokus Scheduling + Content | **Onboarding & leere Zustände** so gestalten, dass Einzelperson in wenigen Minuten postet; Preislogik später nutzerfreundlich (nicht überfrachten) |
| **eclincher** | Sehr **umfangreich**: Publishing, **Monitoring**, teils **SEO**-nahe Features, **Unified Inbox**, **Social Listening** | Modul „**Monitoring**“: Keywords/Hashtags/Mentions **innerhalb** der erlaubten APIs; **SEO** pragmatisch als **Link-/UTM-Verwaltung**, Rich Snippets für geteilte Links — kein vollständiges SEO-Tool von Tag 1 |

### 3.2 Moderne / KI-lastige Spezialisten

| Tool | Typische Stärken | Ins Portfolio übernehmen |
|------|------------------|---------------------------|
| **NapoleonCat** | **Multi-Account**, **automatisches Moderieren**, zentraler Posteingang, Reports | **Regelbasierte Moderation**: z. B. Kommentare mit Stichwort X → Queue „Review“, Spam-Muster → ausblenden/löschen **wo API erlaubt**; **Bulk-Antworten** mit Vorlagen |
| **PostPlanify** | **Viele Accounts**, **Cross-Account-Kalender**, **Bulk Scheduling** | **Entitäten** (4–7+) ohne künstliche Deckel im Kernprodukt; **eine Kalenderansicht** über alle Konten filterbar; **Massen-Zeitplanung** (CSV oder Mehrfach-Auswahl) |
| **MyMarky AI** | **Automatisierung** & **Content-Erstellung** im Fokus, viele Accounts parallel | **KI-Batches**: aus einem Thema mehrere Varianten/Entwürfe; **Wiederverwendung** über Entitäten (angepasst pro Stimme); optionale **Queue „Vorschläge“** zur Freigabe |

### 3.3 Synthese: Dein differenzierendes Feature-Bündel („volle Palette“)

Aus der Kombination ergibt sich dieses **Zielbild** — das ist die Leitplanke für Roadmap und Marketing:

| Säule | Inhalt |
|-------|--------|
| **A. Schnell erstellen** | Buffer-artige Einfachheit + **KI-Varianten** (MyMarky/PostPlanify) + Vorlagen + Medienbibliothek |
| **B. Cross-Plattform & Skalierung** | PostPlanify-artiger **Cross-Account-Kalender**, **Bulk Scheduling**, klare **Entitäts**-Trennung (4–7+ ohne UX-Chaos) |
| **C. Industry-Grade Betrieb** | Hootsuite/Sprout: **Team**, **Analytics**, nachvollziehbare **Reports** |
| **D. Engagement** | Sprout/NapoleonCat: **Unified Inbox**, **Moderation**, Zuweisung, Vorlagen-Antworten |
| **E. Wachstum & Professionalität** | eclincher: **Monitoring/Listening** (API-konform), schrittweise erweitern; **SEO** pragmatisch über Links/UTMs/Metadaten |
| **F. SaaS von Anfang an** | Multi-Tenant, Billing, **Founder-Zugang** gesichert (Abschnitt 2.1) |

**Weitere bewährte Ideen** (aus dem vorherigen Dokumentstand): Later-**Grid-Preview**, **Thread-Modus** (X/Threads), **Canva/Drive**-Anbindung — bleiben kompatibel mit obiger Synthese.

**Hinweis „Pholly“:** Falls damit ein konkretes Produkt gemeint ist, lohnt sich eine **Feature-Checkliste** gegen dessen öffentliche Seite — ohne Namen zu nennen: Dein Ziel „weiter als X“ heißt meist **bessere Kollaboration + zuverlässigeres API-Publishing + modernere KI-Workflows**, nicht unbedingt mehr Oberflächen.

---

## 4. Master-Feature-Liste (Umsetzungs-Backlog)

Unten: **alles**, was für ein vollständiges Produkt dieser Kategorie typischerweise anfällt — **abgestimmt auf die „Best-of“-Synthese** (Abschnitt 3.3) und **4–7 Entitäten** im Workspace. Für das MVP nur die mit **(MVP)** markierten oder eine Teilmenge davon.

### 4.1 Konten, Identitäten & Sicherheit

- [ ] **(MVP)** Benutzer-Accounts (E-Mail/OAuth)
- [ ] **(MVP)** Workspaces / Organisationen (**Multi-Tenant**)
- [ ] **(MVP)** Rollen: Owner, Admin, Editor, Analyst, Moderator (feinjustierbar später)
- [ ] **(MVP)** OAuth-Verbindung pro Plattform; Token-Refresh; sichere Speicherung (Secrets/Encryption)
- [ ] **(MVP)** **Social-Entitäten / Marken**: mehrere logische Identitäten pro Workspace (Ziel **4–7+**), jeweils **n** Plattform-Konten zuordenbar
- [ ] **(MVP)** **Service-/Founder-Accounts**: serverseitige Kennzeichnung für **Billing-Bypass** und garantierte Kontingente (Abschnitt 2.1)
- [ ] Audit-Log (wer hat was geplant/freigegeben/gemoderiert)
- [ ] SSO/SAML (eher Enterprise-Später)
- [ ] 2FA für Team-Accounts

### 4.2 Content-Erstellung

- [ ] **(MVP)** Post-Entwurf mit Titel, Text, Medien-Anhängen
- [ ] **(MVP)** Plattform-spezifische Varianten (Zeichenlimits, Hashtag-Sets, erste Kommentar-Option wo unterstützt)
- [ ] Rich-Text / Markdown-light (je nach Plattform)
- [ ] **Medienbibliothek** mit Upload, Tags, Ordnern
- [ ] Bild-/Video-Metadaten und einfache Zuschnitte (Crop) — oder Delegation an externe Tools
- [ ] **KI:** Caption-Generierung, Ton-Anpassung, Übersetzung, Hashtag-Vorschläge (opt-in, Datenschutz klar)
- [ ] **KI:** **Batch-Erstellung** (ein Thema → mehrere Entwürfe für verschiedene Entitäten/Tonalitäten) — *MyMarky-artig*
- [ ] **KI:** Bildvorschläge/Generierung (optional; Kosten/TOS beachten)
- [ ] Vorlagen (Branding, wiederkehrende Kampagnen)
- [ ] Content-Bibliothek / „Evergreen“-Rotation (später)

### 4.3 Planung & Kalender

- [ ] **(MVP)** Monats-/Wochen-/Listenansicht
- [ ] **(MVP)** **Cross-Account-Ansicht**: ein Kalender über **alle Entitäten/Konten**, Filter nach Marke/Kanal — *PostPlanify-artig*
- [ ] **(MVP)** Drag-and-Drop zum Verschieben
- [ ] **(MVP)** Zeitzone pro Nutzer/Konto; geplante Zeiten
- [ ] **(MVP)** **Bulk Scheduling**: mehrere Entwürfe gleichzeitig zeitlich legen (Mehrfachauswahl oder Import) — *PostPlanify-artig*
- [ ] Wiederholende Posts (mit Warnhinweis bzgl. Duplikat-Policy der Netzwerke)
- [ ] **Visuelles Grid-Preview** (Instagram-Fokus)
- [ ] Queue/„nächster freier Slot“ (Buffer-Idee)
- [ ] Kampagnen-Tags und Filter

### 4.4 Publishing & Zuverlässigkeit

- [ ] **(MVP)** Scheduler-Backend (Queue)
- [ ] **(MVP)** Worker mit Retries, exponentiellem Backoff
- [ ] **(MVP)** Status: Entwurf → geplant → veröffentlicht → fehlgeschlagen (+ Grund)
- [ ] Rate-Limit-Handling pro Plattform
- [ ] Teil-Failures bei Multi-Plattform-Posts transparent machen
- [ ] **(MVP)** Manuelles „Jetzt posten“
- [ ] **Bulk-Import** (CSV/Sheet) für geplante Posts — sobald Kern stabil
- [ ] Compliance-Hinweise pro Netzwerk (z. B. Medienformate)

### 4.5 Plattform-Abdeckung (typisch)

> Exakte Reichweite hängt von **API-Freigaben**, App-Review und Kontotypen (Business/Creator) ab.

- [ ] **(MVP)** Meta: Facebook Pages / Instagram Business (Feed, Reels je nach API)
- [ ] **(MVP)** LinkedIn (Personal/Page je nach API-Möglichkeit)
- [ ] **(MVP)** X (Twitter) — abhängig von API-Tier und Kosten
- [ ] TikTok (Content Posting API — App-Review)
- [ ] YouTube (Uploads — oft eigener OAuth-Flow)
- [ ] Pinterest, Threads, Bluesky … nach Nachfrage
- [ ] Kurz: **Roadmap pro Plattform** statt „alles Tag 1“

### 4.6 Engagement (Social Inbox)

- [ ] **(MVP)** **Unified Inbox**: Kommentare und Erwähnungen **kanalübergreifend** in einer Liste — *Sprout-artig* (DMs nach Plattform-Möglichkeit)
- [ ] Kommentare auf Posts aggregieren (wo API erlaubt)
- [ ] Zuweisung, Status (offen/erledigt), interne Notizen
- [ ] Schnellantworten / gespeicherte Antworten
- [ ] DMs nur wo API und Policy das sinnvoll erlauben (oft eingeschränkt)

### 4.6a Moderation & Automatisierung (Community)

- [ ] **Moderationsregeln**: Schlüsselwörter → Queue „Review“ / Zuweisung — *NapoleonCat-artig*
- [ ] **Regelbasierte Aktionen** wo API erlaubt: ausblenden, löschen, melden (pro Plattform differenziert dokumentieren)
- [ ] Spam-/Link-Erkennung (heuristisch) + manuelle Override-UI
- [ ] **Einfache Automations** (wenn X dann Y): z. B. neuer negativer Kommentar → Slack/E-Mail/Webhook — *Sprout/eclincher-Idee, schrittweise*

### 4.7 Analytics & Reporting

- [ ] **(MVP light)** Basis-KPIs: Impressions/Reach/Likes/Comments je Post (soweit verfügbar)
- [ ] Zeitreihen pro Kanal und **pro Entität** (Aggregat)
- [ ] Export CSV/PDF
- [ ] **Agentur:** White-Label-PDF (später)
- [ ] UTMs und Link-Klick-Tracking für externe Links (eigenes Redirect-Feature optional)
- [ ] **Vergleichsansichten** (Zeiträume, Kanäle) — *Hootsuite/Sprout-Erwartung*

### 4.7a Monitoring & SEO (pragmatisch)

- [ ] **Keyword/Hashtag-Mentions** innerhalb der APIs (Listening **light**) — *eclincher-Richtung, ohne vollständiges Newsroom-Produkt*
- [ ] **Link-Hub**: zentrale UTM-Builder, gespeicherte Kampagnen-Links, Vorschau-Metadaten
- [ ] Optional später: Google Business Profile / weitere Local-Kanäle — nur bei klarer Priorität

### 4.8 Kollaboration & Workflows

- [ ] **(MVP)** Kommentare am Entwurf (intern)
- [ ] Freigabe-Workflow (Submit → Review → Approve)
- [ ] Content-Kalender-„Read-only“-Link für Kunden (optional)
- [ ] Benachrichtigungen (E-Mail/In-App)

### 4.9 Integrationen

- [ ] **(MVP)** Import von Medien-URLs oder Cloud (Google Drive/Dropbox) — mindestens „Share Link“/Download-Flow
- [ ] Canva „öffnen und zurück“ (Deep-Link/Export-Flow)
- [ ] Zapier/Make/n8n via Webhooks (später)
- [ ] **Öffentliche REST API** + API-Keys (Power-User / eigene Automation)
- [ ] Optional: **Unified Social API** (siehe Tech-Stack) für schnellere Plattform-Expansion

### 4.10 Monetarisierung (Produkt-seitig, falls geplant)

- [ ] **(MVP Architektur)** Pläne nach Workspaces/Konten/Volume — **Limits im Code** von Anfang an
- [ ] Nutzungsmessung (Posts/Monat, Teamgröße, API-Calls)
- [ ] Billing (Stripe o. Ä.) + **Webhooks** für erfolgreiche/fehlgeschlagene Zahlung
- [ ] **Founder/Service-Accounts** von Limits ausnehmen (konfigurierbar, auditierbar)

### 4.11 Qualität, Betrieb, Compliance

- [ ] Datenschutz: Auftragsverarbeitung, Löschkonzepte, Region (EU-Hosting optional)
- [ ] Plattform-ToS einhalten (kein Banned-Behavior)
- [ ] Observability: Logs, Metriken, Alerts bei Queue-Stau
- [ ] Feature-Flags für riskante Beta-Features

---

## 5. Tech-Stack-Empfehlung (recherchiert & begründet)

### 5.1 Architektur grob

- **Monolith-first oder modulares Monolith:** Schnellere Iteration als Microservices am Anfang. Klar getrennte Module: *Auth*, *Accounts/OAuth*, *Content*, *Scheduler/Worker*, *Analytics-Ingest*.
- **Asynchrones Publishing:** Queue (z. B. Redis + Worker oder verwalteter Job-Service), damit API-Hänger und Retries das Web-Frontend nicht blockieren.
- **Single-Page-App oder Next.js:** Starke Kalender-UX braucht reaktives UI; Server-Rendering für Marketing/Landing optional.

### 5.2 Frontend

| Technologie | Rolle |
|-------------|--------|
| **TypeScript** | Durchgängige Typsicherheit |
| **React** + **Next.js** (App Router) | UI, Routing, API Routes/BFF für OAuth-Callbacks |
| **TanStack Query** | Server-State (Entwürfe, Kalenderdaten) |
| **Zustand oder ähnlich** | Lokaler UI-State |
| **Tailwind CSS** + **Radix UI** / **shadcn/ui** | Schnelle, zugängliche UI |
| **FullCalendar oder custom Grid** | Kalender; Grid-Preview für IG ggf. custom |
| **TipTap oder Lexical** | Rich Text, falls nötig |

**Begründung:** Breite Ökosystem-Hilfen, gute Hiring-Basis, Next.js eignet sich für OAuth- und Webhook-Endpunkte ohne zweiten Server.

### 5.3 Backend & API

| Technologie | Rolle |
|-------------|--------|
| **Node.js (LTS)** mit **TypeScript** | Eine Sprache mit Frontend; gute Libs für OAuth/HTTP |
| **Alternativ:** **Python (FastAPI)** oder **Go** | Go für Worker-Skalierung; Python für ML/KI später — Mischung möglich (API in TS, Worker in Go) |
| **PostgreSQL** | Relationale Daten: Nutzer, Workspaces, Posts, Schedules, Status |
| **Redis** | Queues, Locks, Rate-Limit-Zähler |
| **Prisma / Drizzle** (Node) oder **SQLAlchemy** (Python) | ORM/Migrationen |

**Begründung:** Postgres ist der Standard für SaaS mit komplexen Abfragen; Redis für Scheduler/Locks ist bewährt.

### 5.4 OAuth & Plattform-APIs

- **Direktintegration** pro Plattform über offizielle APIs (Meta Graph, LinkedIn, X API v2, TikTok Developer Portal, etc.).
- **Alternative / Beschleuniger:** **Aggregator-APIs** (Konzepte wie Ayrshare, Outstand, Upload-Post, Zernio — jeweils eigene Kosten, SLAs und Datenschutz prüfen). Sinnvoll, wenn **Time-to-Market** wichtiger ist als volle Kontrolle über jeden OAuth-Flow.

**Wichtig:** Jede Plattform hat **App Review**, **Rate Limits** und **Kosten** (besonders X) — im Produktplan einplanen.

### 5.5 KI

- **Anbieter:** OpenAI / Anthropic / Azure OpenAI — je nach Datenschutzanforderungen und Hosting-Region.
- **Pattern:** Server-seitige Aufrufe nur mit **redaktionellen** Prompts; keine unkontrollierte Speicherung von Kundendaten in Trainingsdaten (AVV/Zero-retention je nach Anbieter prüfen).

### 5.6 Dateien & Medien

- **Object Storage:** S3-kompatibel (AWS S3, Cloudflare R2, Backblaze B2) für Uploads.
- **Bildverarbeitung:** Sharp (Node) oder externer Dienst für Thumbnails.

### 5.7 Infra & Betrieb

| Option | Für wen |
|--------|---------|
| **Docker Compose** (dev/staging) | Lokal konsistent wie in deinen Vorgaben |
| **Kubernetes** | Erst bei echtem Skalierungsdruck |
| **Fly.io, Railway, Render, oder Cloud Run** | Einfaches Hosting für MVP |
| **GitHub Actions** | CI/CD, Tests, Lint |

Monitoring: OpenTelemetry, strukturierte Logs (JSON), Error Tracking (Sentry).

### 5.8 Empfohlene „Default“-Kombination (pragmatisch)

**Next.js (TS) + Postgres + Redis + Worker-Prozess in Node + S3 + OAuth direkt für 2–3 große Netzwerke**, danach Entscheidung: weitere Plattformen nativ oder über **einen** Aggregator.

**SaaS-Ergänzung (gleicher Stack):** **Stripe** (Checkout + Customer Portal + Webhooks) für öffentliche Pläne; in Postgres **workspace_id** durchgängig; **Row-Level Security** optional später für härtere Isolation. Founder-/Service-Flags in der `users`- oder `workspace_members`-Tabelle, **niemals** nur im Frontend.

Das minimiert Sprach-Splitting am Anfang und hält die Komplexität beherrschbar.

---

## 6. Offene strategische Entscheidungen (kurz)

1. **Eigenes 4–7-Entitäten-Setup vs. generische SaaS-Kunden:** Gleiches Datenmodell; **Founder-Bypass** sichert deinen Betrieb unabhängig von Billing.
2. **Native APIs vs. Aggregator:** Trade-off Kontrolle/Kosten vs. Geschwindigkeit — bei vielen Plattformen mittelfristig **ein** Aggregator für Erweiterung erwägen.
3. **Tiefe des „Listening“:** Keyword/Mention innerhalb APIs zuerst; **breites** Web/News-Listening ist eigenes Produkt — nur bei Budget und Compliance.
4. **KI:** Assistenz vs. „vollautomatische“ Veröffentlichung — letzteres nur mit strikten Freigaben (rechtliches Risiko).
5. **Moderation:** Auto-Aktionen immer an **Plattform-ToS** und **API-Fähigkeiten** koppeln; UI transparent dokumentieren, was automatisch geht.

---

## 7. Referenzen (Recherche)

- [PostPlanify](https://postplanify.com/) — Kalender, Bulk, Multi-Account, KI, Inbox (öffentliche Produktseite).
- [Hootsuite](https://www.hootsuite.com/), [Sprout Social](https://sproutsocial.com/), [Buffer](https://buffer.com/) — jeweils für Erwartungen an Team, Analytics, Einfachheit.
- [eclincher](https://www.eclincher.com/), [NapoleonCat](https://napoleoncat.com/) — Umfang Inbox/Monitoring/Moderation (öffentliche Darstellung).
- [MyMarky](https://www.mymarky.ai/) — Fokus KI & Automatisierung (öffentliche Darstellung).
- [Instagram APIs / Meta for Developers](https://developers.facebook.com/products/instagram/apis/) — offizielle Publishing-Perspektive.
- [TikTok Content Posting API](https://developers.tiktok.com/products/content-posting-api/) — direktes Posting über registrierte Apps.
- Branchenvergleiche (z. B. [Zapier — Social Media Management Tools](https://zapier.com/blog/best-social-media-management-tools/)) — für Feature-Erwartungen.

---

*Stand der Recherche: April 2026 (Web-Recherche). Plattform-APIs und Preise ändern sich — vor Implementierung immer aktuelle Dokumentation und App-Review-Bedingungen prüfen.*
