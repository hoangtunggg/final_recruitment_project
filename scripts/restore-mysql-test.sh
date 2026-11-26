#!/usr/bin/env bash
set -euo pipefail

backup_file="${1:?Usage: scripts/restore-mysql-test.sh BACKUP.sql.gz [test_database]}"
test_database="${2:-job_portal_restore_test}"

if [[ ! "$test_database" =~ (_test|_restore)$ ]]; then
  echo "Refusing restore: target database must end with _test or _restore." >&2
  exit 1
fi

gzip -t "$backup_file"
exists="$(docker compose -f compose.production.yaml exec -T db sh -lc \
  'mysql -N -u root --password="$(cat /run/db-secrets/mysql_root_password)" -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME=\"'"$test_database"'\""')"
if [[ -n "$exists" ]]; then
  echo "Refusing restore: database '$test_database' already exists." >&2
  exit 1
fi

docker compose -f compose.production.yaml exec -T db sh -lc \
  'mysql -u root --password="$(cat /run/db-secrets/mysql_root_password)" -e "CREATE DATABASE \`'"$test_database"'\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"'
gzip -dc "$backup_file" | docker compose -f compose.production.yaml exec -T db sh -lc \
  'exec mysql -u root --password="$(cat /run/db-secrets/mysql_root_password)" '"$test_database"

docker compose -f compose.production.yaml exec -T db sh -lc \
  'mysql -u root --password="$(cat /run/db-secrets/mysql_root_password)" -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema=\"'"$test_database"'\" ORDER BY table_name"'
echo "Restore validated in separate database: $test_database"
