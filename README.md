# Social Media Monster

Monorepo: `apps/web` (Next.js), `packages/shared` (Zod types & env schema).

## Quick start

1. Copy `apps/web/.env.example` to `apps/web/.env.local` and set `DATABASE_URL`, `AUTH_SECRET` (32+ chars), optionally `OPENAI_API_KEY` and `REDIS_URL`.

2. Start Postgres & Redis:

```bash
docker compose up -d
```

3. Apply DB schema:

```bash
cd apps/web
npx drizzle-kit push
```

4. Dev server:

```bash
npm run dev -w web
```

5. Optional: publish worker (requires `REDIS_URL`):

```bash
npm run worker -w web
```

## Features

- Multi-tenant workspaces, roles, founder bypass flag on users (for quotas).
- **Creation Studio**: chat + working document revisions, Meta post (~4000 chars) + image, channel variants, scheduling.
- Demo platform + `POST /api/connections/demo` for local posting without OAuth.
- BullMQ queue when Redis is configured; otherwise inline publish.
- Stripe webhook stub, inbox/moderation/analytics API scaffolding.

See `docs/product-portfolio-and-tech-stack.md` for product context.
