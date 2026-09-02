#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 /var/backups/gopaq/gopaq-YYYYmmddTHHMMSSZ.dump" >&2
  exit 2
fi

APP_DIR="${GOPAQ_APP_DIR:-/opt/gopaq}"
ENV_FILE="${GOPAQ_ENV_FILE:-$APP_DIR/.env.production}"
DUMP_FILE="$1"
cd "$APP_DIR"
set -a
. "$ENV_FILE"
set +a
[[ -s "$DUMP_FILE" ]] || { echo "Backup inválido o vacío." >&2; exit 1; }

restore_db="gopaq_restore_test_$(date -u +%Y%m%d%H%M%S)"
cleanup() { docker compose --env-file "$ENV_FILE" exec -e PGPASSWORD="$POSTGRES_PASSWORD" -T postgres dropdb --if-exists --username "$POSTGRES_USER" "$restore_db" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker compose --env-file "$ENV_FILE" exec -e PGPASSWORD="$POSTGRES_PASSWORD" -T postgres createdb --username "$POSTGRES_USER" "$restore_db"
docker compose --env-file "$ENV_FILE" exec -e PGPASSWORD="$POSTGRES_PASSWORD" -T postgres pg_restore --exit-on-error --no-owner --username "$POSTGRES_USER" --dbname "$restore_db" < "$DUMP_FILE"
count="$(docker compose --env-file "$ENV_FILE" exec -e PGPASSWORD="$POSTGRES_PASSWORD" -T postgres psql -At --username "$POSTGRES_USER" --dbname "$restore_db" -c 'SELECT COUNT(*) FROM organizations;')"
printf 'restore_test_database=%s organizations=%s status=ok\n' "$restore_db" "${count//$'\n'/}"
