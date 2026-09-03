# GoPaq — OSS engines

GoPaq consumes **Karrio** and **Witylogix** as independent network services. Their source code is not copied into GoPaq.

## Start the stack

1. Copy `.env.example` to `.env` and replace every `replace_*` secret.
2. Start GoPaq + Karrio + Witylogix:

```bash
docker compose -f docker-compose.yml -f docker-compose.oss.yml up -d --build
```

3. Verify GoPaq:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/v1/integrations/health
```

## Karrio

Karrio runs as an independent service with its own PostgreSQL and Redis containers. After first boot, create/bootstrap a Karrio API token and set `KARRIO_API_KEY` in `.env`; restart `gopaq-api` afterwards. International quote requests then call Karrio instead of fabricating carrier rates.

## Witylogix

Witylogix is AGPL-3.0, therefore GoPaq keeps a strict HTTP boundary. The compose stack builds a pinned Witylogix revision and runs its PostgreSQL/PostGIS, Redis, migration and API services independently.

After first boot, provision a Witylogix tenant/shop and a Bearer credential for GoPaq, set `WITYLOGIX_API_TOKEN`, and restart `gopaq-api`. GoPaq route dispatch then mirrors delivery orders and the route into the Witylogix `/api/v4` API.

## Role URLs

- `/super-admin/*` — SUPER_ADMIN / OWNER / ADMIN / OPERATIONS
- `/portal/*` — CLIENT / CUSTOMER
- `/sucursal/*` — BRANCH_MANAGER / MANAGER / COUNTER / DISPATCHER / WAREHOUSE / CASHIER
- `/driver/*` — DRIVER / COURIER
- `/docs/api/*` — API documentation

The frontend checks `/api/v1/auth/me` before rendering protected areas and redirects a valid user to the route assigned to their backend role.

## Database note

GoPaq Core uses PostgreSQL/PostGIS in the production compose. SQLite remains available only for local development and tests. Karrio and Witylogix run as independent PostgreSQL-backed services in the optional OSS stack, and their HTTP ports stay inside the private Docker network.
