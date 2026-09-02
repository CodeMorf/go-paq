#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${GOPAQ_APP_DIR:-/opt/gopaq}"
ENV_FILE="${GOPAQ_ENV_FILE:-$APP_DIR/.env.production}"
BACKUP_DIR="${GOPAQ_BACKUP_DIR:-/var/backups/gopaq}"
RETENTION_DAYS="${GOPAQ_BACKUP_RETENTION_DAYS:-14}"

cd "$APP_DIR"
set -a
. "$ENV_FILE"
set +a
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BACKUP_DIR/gopaq-${stamp}.dump"
docker compose --env-file "$ENV_FILE" exec -e PGPASSWORD="$POSTGRES_PASSWORD" -T postgres pg_dump --format=custom --no-owner --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" > "$target"
chmod 600 "$target"
find "$BACKUP_DIR" -type f -name 'gopaq-*.dump' -mtime "+$RETENTION_DAYS" -delete
printf 'backup=%s size_bytes=%s\n' "$target" "$(stat -c '%s' "$target")"
