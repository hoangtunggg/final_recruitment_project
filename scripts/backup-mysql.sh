#!/usr/bin/env bash
set -euo pipefail

backup_dir="${1:-./backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_dir/job_portal_${timestamp}.sql.gz"

docker compose -f compose.production.yaml exec -T db sh -lc \
  'exec mysqldump --single-transaction --quick --routines --triggers -u root --password="$(cat /run/db-secrets/mysql_root_password)" job_portal' \
  | gzip -9 > "$target"

gzip -t "$target"
echo "Backup verified: $target"
