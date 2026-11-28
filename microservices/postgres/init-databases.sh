#!/bin/sh
set -eu

services="identity user company job resume application matching notification"
for service in $services; do
  upper="$(printf '%s' "$service" | tr '[:lower:]' '[:upper:]')"
  eval "password=\${${upper}_DB_PASSWORD:-}"
  if [ -z "$password" ] || ! printf '%s' "$password" | grep -Eq '^[A-Za-z0-9_.-]{16,128}$'; then
    echo "Invalid or missing ${upper}_DB_PASSWORD" >&2
    exit 1
  fi
  role="${service}_service"
  database="${service}_db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    --set=role="$role" --set=password="$password" \
    -c "CREATE ROLE \"$role\" LOGIN PASSWORD '$password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION CONNECTION LIMIT 20"
  createdb --username "$POSTGRES_USER" --owner "$role" "$database"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    -c "REVOKE CONNECT ON DATABASE \"$database\" FROM PUBLIC; GRANT CONNECT ON DATABASE \"$database\" TO \"$role\""
done
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname matching_db -c "CREATE EXTENSION IF NOT EXISTS vector"
